/**
 * LangGraph agentic workflow: listing description → structured Instagram copy.
 *
 * Architecture — real tool-calling agent loop:
 *
 *   START → initMessages
 *         → agent           (LLM with bound tools: decides what to do)
 *         ↕  [tool-call loop]
 *         → tools           (ToolNode: executes tool calls, appends ToolMessages)
 *         → agent           (LLM reads results, decides to call more tools or answer)
 *         → validateOutput  (JSON.parse + Zod; extracts finalOutput)
 *         ↕  [repair loop up to MAX_ATTEMPTS on bad output]
 *         → repairAgent     (appends error + repair prompt to messages)
 *         → agent           (LLM sees error, can use tools again before re-answering)
 *         → validateOutput
 *         → END
 *
 * The LLM is shown full tool schemas (name, description, Zod input schema) via
 * .bindTools() in modelProvider.js. It decides:
 *   - whether to call fetch_preferred_copy_examples (and which category)
 *   - whether to call get_artist_voice_profile
 *   - when it has enough context to produce the final JSON answer
 *
 * The code never calls tools directly. ToolNode handles all tool execution and
 * appends ToolMessages to the thread for the model to read.
 */

const { StateGraph, MessagesAnnotation, Annotation, START, END } = require('@langchain/langgraph');
const { ToolNode } = require('@langchain/langgraph/prebuilt');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { fetchPreferredCopyExamplesTool, getArtistVoiceProfileTool } = require('./igTools');
const { modelIgOutputSchema } = require('./schemas');
const { createChatModel } = require('./modelProvider');

const MAX_ATTEMPTS = 3;

const TOOLS = [fetchPreferredCopyExamplesTool, getArtistVoiceProfileTool];

// ─── State ────────────────────────────────────────────────────────────────────
//
// Extends MessagesAnnotation (which provides the messages[] reducer) with
// additional fields for the request context, validated output, and retry state.

const IgAgentState = Annotation.Root({
    ...MessagesAnnotation.spec,
    userInput: Annotation(),
    tone: Annotation(),
    focus: Annotation(),
    finalOutput: Annotation(),
    validationErrors: Annotation(),
    attempts: Annotation()
});

// ─── Model singleton ──────────────────────────────────────────────────────────
//
// Lazy-initialised on first agent invocation. Tests can replace this via
// setModelForTesting() without needing API keys or a running provider.

let _modelWithTools = null;

function getModelWithTools() {
    if (!_modelWithTools) {
        _modelWithTools = createChatModel(TOOLS);
    }
    return _modelWithTools;
}

function setModelForTesting(model) {
    _modelWithTools = model;
}

// ─── Prompt constants ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an Instagram copy assistant for a visual artist. Your task is to generate Instagram post components from a rough description of their artwork or listing.

You have two tools available:
  • fetch_preferred_copy_examples — loads copy lines the artist has previously approved; use these as style and tone references.
  • get_artist_voice_profile      — loads the artist's brand preferences: brandIdentity (who they are), emphasize (what to highlight), and avoid (what to never include).

Always call get_artist_voice_profile before writing. Call fetch_preferred_copy_examples when you want concrete examples of their preferred writing style.

Your final response must be ONLY a single valid JSON object — no markdown fences, no commentary, nothing outside the JSON. Required shape:
{
  "hooks":    [exactly 3 short attention-grabbing openers],
  "captions": [exactly 3 body captions],
  "ctas":     [exactly 3 calls to action],
  "hashtags": [exactly 10 hashtags]
}`;

function buildHumanMessage(state) {
    return [
        'Please write Instagram copy for the following piece:',
        '',
        state.userInput,
        '',
        `Tone: ${state.tone || 'Simple'}`,
        `Focus: ${state.focus || 'Story'}`
    ].join('\n');
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

function initMessagesNode(state) {
    return {
        messages: [
            new SystemMessage(SYSTEM_PROMPT),
            new HumanMessage(buildHumanMessage(state))
        ],
        finalOutput: null,
        validationErrors: null,
        attempts: 0
    };
}

async function agentNode(state) {
    const model = getModelWithTools();
    const response = await model.invoke(state.messages);
    return { messages: [response] };
}

function validateOutputNode(state) {
    const lastMessage = state.messages[state.messages.length - 1];

    // Guard: agent chose to make another tool call instead of answering — shouldn't
    // reach validateOutput but handled for safety.
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return { validationErrors: 'Agent made tool calls instead of producing a final answer.' };
    }

    const raw = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content || '');

    // Strip markdown code fences that some models add despite instructions.
    const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        return { validationErrors: 'Model output was not valid JSON.' };
    }

    const check = modelIgOutputSchema.safeParse(parsed);
    if (!check.success) {
        const detail = check.error.flatten().fieldErrors;
        const msg = Object.keys(detail).length
            ? `Output failed schema validation: ${JSON.stringify(detail)}`
            : 'Output failed schema validation.';
        return { validationErrors: msg };
    }

    return { finalOutput: check.data, validationErrors: null };
}

function repairAgentNode(state) {
    const errorMsg = state.validationErrors || 'Your previous output was invalid.';
    return {
        messages: [
            new HumanMessage(
                `Your previous response was not valid.\nError: ${errorMsg}\n\n` +
                'Respond with ONLY a JSON object — no markdown fences, no explanation.\n' +
                'Required: { "hooks": [3 strings], "captions": [3 strings], ' +
                '"ctas": [3 strings], "hashtags": [10 strings] }'
            )
        ],
        attempts: (state.attempts || 0) + 1,
        validationErrors: null
    };
}

// ─── Routing ──────────────────────────────────────────────────────────────────

function routeAfterAgent(state) {
    const last = state.messages[state.messages.length - 1];
    if (last.tool_calls && last.tool_calls.length > 0) {
        return 'tools';
    }
    return 'validate';
}

function routeAfterValidate(state) {
    if (state.finalOutput) return 'success';
    if ((state.attempts || 0) < MAX_ATTEMPTS) return 'repair';
    return 'error';
}

// ─── Graph compilation ────────────────────────────────────────────────────────

const igGenerationGraph = new StateGraph(IgAgentState)
    .addNode('initMessages', initMessagesNode)
    .addNode('agent', agentNode)
    .addNode('tools', new ToolNode(TOOLS))
    .addNode('validateOutput', validateOutputNode)
    .addNode('repairAgent', repairAgentNode)
    .addEdge(START, 'initMessages')
    .addEdge('initMessages', 'agent')
    .addConditionalEdges('agent', routeAfterAgent, {
        tools: 'tools',
        validate: 'validateOutput'
    })
    .addEdge('tools', 'agent')
    .addConditionalEdges('validateOutput', routeAfterValidate, {
        success: END,
        repair: 'repairAgent',
        error: END
    })
    .addEdge('repairAgent', 'agent')
    .compile();

// ─── Public API ───────────────────────────────────────────────────────────────

async function runIgGeneration(input) {
    return igGenerationGraph.invoke({
        userInput: input.userInput,
        tone: input.tone,
        focus: input.focus
    });
}

module.exports = {
    runIgGeneration,
    igGenerationGraph,
    setModelForTesting
};
