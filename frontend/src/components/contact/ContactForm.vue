<template>
  <form class="form contact-page__form" :class="formClass" @submit.prevent="onSubmit" autocomplete="on">
    <label :for="fieldId('name')">
      {{ page.form_name_label }}
      <input
        :id="fieldId('name')"
        v-model.trim="name"
        name="name"
        type="text"
        autocomplete="name"
        required
      >
    </label>
    <label :for="fieldId('email')">
      {{ page.form_email_label }}
      <input
        :id="fieldId('email')"
        v-model.trim="email"
        name="visitor_email"
        type="email"
        autocomplete="email"
        required
      >
    </label>
    <label :for="fieldId('subject')">
      {{ page.form_subject_label }}
      <input
        :id="fieldId('subject')"
        v-model.trim="subject"
        name="subject"
        type="text"
        required
      >
    </label>
    <label :for="fieldId('message')">
      {{ page.form_message_label }}
      <textarea
        :id="fieldId('message')"
        v-model.trim="message"
        name="message"
        :rows="compact ? 4 : 6"
        required
      />
    </label>
    <p v-if="submitted" class="contact-page__sent" role="status">{{ sentMessage }}</p>
    <p v-if="submitError" class="error contact-form__error">{{ submitError }}</p>
    <button type="submit" class="btn-primary" :disabled="busy">
      {{ busy ? 'submitting…' : page.form_submit_label }}
    </button>
  </form>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { submitContactForm } from '../../services/api.js';
import { isValidEmail } from '@shared/email.js';
import { useContactPage } from '../../composables/useContactPage.js';

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  },
  fieldIdPrefix: {
    type: String,
    default: 'contact'
  },
  formClass: {
    type: String,
    default: ''
  }
});

const { page, ensureContactPage } = useContactPage();

const name = ref('');
const email = ref('');
const subject = ref('');
const message = ref('');
const submitted = ref(false);
const sentMessage = ref('');
const busy = ref(false);
const submitError = ref('');

function fieldId(namePart) {
  return `${props.fieldIdPrefix}-${namePart}`;
}

function validateForm() {
  if (!String(name.value).trim()) return 'name is required.';
  if (!String(email.value).trim()) return 'email is required.';
  if (!isValidEmail(String(email.value).trim())) {
    return 'enter a valid email address.';
  }
  if (!String(subject.value).trim()) return 'subject is required.';
  if (!String(message.value).trim()) return 'message is required.';
  return null;
}

async function onSubmit() {
  submitError.value = '';
  submitted.value = false;
  const validationError = validateForm();
  if (validationError) {
    submitError.value = validationError;
    return;
  }

  busy.value = true;
  try {
    const result = await submitContactForm({
      name: name.value,
      email: email.value,
      subject: subject.value,
      message: message.value
    });
    sentMessage.value = result?.message || page.value.success_message;
    submitted.value = true;
    name.value = '';
    email.value = '';
    subject.value = '';
    message.value = '';
  } catch (e) {
    submitError.value = e.message || 'unable to send message.';
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  ensureContactPage();
});
</script>

<style scoped>
.contact-form__error {
  margin: 0;
}
</style>
