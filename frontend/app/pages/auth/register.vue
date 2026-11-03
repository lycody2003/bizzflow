
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import useAuthStore from '../../stores/auth.store'

definePageMeta({
  middleware: 'guest',
  layout: 'auth',
})

const authStore = useAuthStore()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
})

const showPassword = ref(false)
const errorMessage = ref('')

const isLoading = computed(() => authStore.isLoading.value)

const handleRegister = async (): Promise<void> => {
  errorMessage.value = ''

  try {
    const result = await authStore.register(form)

    if (result) {
      await navigateTo('/')
    }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Unable to create your account. Please try again.'
  }
}
</script>

<template>
  <main class="auth-page">
    <!-- Branding Section -->
    <section class="auth-brand">
      <div class="brand-background">
        <div class="brand-circle brand-circle-one" />
        <div class="brand-circle brand-circle-two" />
        <div class="brand-circle brand-circle-three" />
      </div>

      <div class="brand-content">
        <NuxtLink to="/auth/login" class="brand-logo">
          <span class="logo-icon">B</span>
          <span>BizzFlow</span>
        </NuxtLink>

        <div class="brand-message">
          <span class="eyebrow">
            YOUR BUSINESS, ONE PLATFORM
          </span>

          <h1>
            Everything your business needs.
            <span>All in one place.</span>
          </h1>

          <p>
            Simplify your daily operations and make better
            business decisions with BizzFlow.
          </p>

          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-check">✓</span>
              Organize your business operations
            </div>

            <div class="feature-item">
              <span class="feature-check">✓</span>
              Manage products and inventory
            </div>

            <div class="feature-item">
              <span class="feature-check">✓</span>
              Track your business performance
            </div>
          </div>
        </div>

        <div class="brand-footer">
          <span>© 2026 BizzFlow. All rights reserved.</span>
          <span>Built for better business management.</span>
        </div>
      </div>
    </section>

    <!-- Register Form Section -->
    <section class="auth-form-section">
      <div class="auth-form-wrapper">
        <div class="mobile-logo">
          <NuxtLink to="/auth/login" class="brand-logo">
            <span class="logo-icon">B</span>
            <span>BizzFlow</span>
          </NuxtLink>
        </div>

        <div class="form-heading">
          <span class="welcome-label">
            GET STARTED
          </span>

          <h2>Create your account</h2>

          <p>
            Enter your details to create your BizzFlow account.
          </p>
        </div>

        <form
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <!-- First Name and Last Name -->
          <div class="name-row">
            <div class="form-group">
              <label for="firstName">
                First name
              </label>

              <input
                id="firstName"
                v-model.trim="form.firstName"
                type="text"
                autocomplete="given-name"
                placeholder="First name"
                maxlength="50"
                required
                :disabled="isLoading"
              >
            </div>

            <div class="form-group">
              <label for="lastName">
                Last name
              </label>

              <input
                id="lastName"
                v-model.trim="form.lastName"
                type="text"
                autocomplete="family-name"
                placeholder="Last name"
                maxlength="50"
                required
                :disabled="isLoading"
              >
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">
              Email address
            </label>

            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
              :disabled="isLoading"
            >
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">
              Password
            </label>

            <div class="password-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                minlength="8"
                required
                :disabled="isLoading"
              >

              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>

            <span class="field-hint">
              Use at least 8 characters.
            </span>
          </div>

          <!-- Error Message -->
          <Transition name="error">
            <div
              v-if="errorMessage"
              class="error-message"
              role="alert"
            >
              <span class="error-icon">!</span>
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <!-- Submit -->
          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner" />

            <span>
              {{ isLoading ? 'Creating account...' : 'Create account' }}
            </span>

            <span v-if="!isLoading" class="button-arrow">
              →
            </span>
          </button>
        </form>

        <div class="auth-switch">
          <span>Already have an account?</span>

          <NuxtLink to="/auth/login">
            Sign in
          </NuxtLink>
        </div>

        <div class="form-footer">
          <span class="footer-lock">◇</span>
          Your business information is protected.
        </div>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  color: #172033;
  background: #fff;
}

// Branding

.auth-brand {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 64px clamp(32px, 6vw, 88px);
  color: #fff;
  background: linear-gradient(145deg, #101d3b 0%, #173c78 100%);
}

.brand-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.brand-circle {
  position: absolute;
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 50%;
}

.brand-circle-one {
  width: 620px;
  height: 620px;
  top: -210px;
  right: -250px;
}

.brand-circle-two {
  width: 440px;
  height: 440px;
  right: -160px;
  bottom: -170px;
}

.brand-circle-three {
  width: 260px;
  height: 260px;
  right: 30px;
  bottom: -120px;
}

.brand-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 540px;
  min-height: 650px;
  margin: auto;
  display: flex;
  flex-direction: column;
}

.brand-logo {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  font-size: 22px;
  font-weight: 750;
  text-decoration: none;
}

.logo-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 12px;
  color: #fff;
  background: #3979e8;
  font-size: 23px;
  font-weight: 800;
}

.brand-message {
  margin: auto 0;

  .eyebrow {
    color: #8bb7ff;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 2px;
  }

  h1 {
    max-width: 540px;
    margin: 24px 0 20px;
    font-size: clamp(34px, 4vw, 54px);
    font-weight: 750;
    line-height: 1.2;
    letter-spacing: -2px;

    span {
      display: block;
      color: #8bb7ff;
    }
  }

  p {
    max-width: 440px;
    margin: 0;
    color: #c1cde1;
    font-size: 15px;
    line-height: 1.9;
  }
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 17px;
  margin-top: 35px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dce7f8;
  font-size: 13px;
}

.feature-check {
  width: 21px;
  height: 21px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #a7c8ff;
  background: rgb(139 183 255 / 15%);
  font-size: 12px;
  font-weight: 700;
}

.brand-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  color: #9eacc5;
  font-size: 11px;
}

// Form

.auth-form-section {
  min-width: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px clamp(28px, 5vw, 80px);
}

.auth-form-wrapper {
  width: 100%;
  max-width: 440px;
  margin: auto;
}

.mobile-logo {
  display: none;
  margin-bottom: 45px;
  color: #172033;
}

.form-heading {
  margin-bottom: 30px;

  .welcome-label {
    color: #3979e8;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 1.8px;
  }

  h2 {
    margin: 14px 0 10px;
    color: #172033;
    font-size: clamp(25px, 2.5vw, 32px);
    font-weight: 750;
    letter-spacing: -1px;
    line-height: 1.3;
  }

  p {
    margin: 0;
    color: #7b8495;
    font-size: 14px;
    line-height: 1.7;
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 21px;
}

.name-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
}

.form-group {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;

  label {
    color: #293449;
    font-size: 13px;
    font-weight: 650;
  }

  input {
    width: 100%;
    min-width: 0;
    height: 50px;
    padding: 0 15px;
    border: 1px solid #e0e5ed;
    border-radius: 9px;
    outline: none;
    color: #172033;
    background: #fff;
    font: inherit;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;

    &::placeholder {
      color: #a5adba;
    }

    &:hover:not(:disabled) {
      border-color: #bdc8d9;
    }

    &:focus {
      border-color: #3979e8;
      box-shadow: 0 0 0 3px rgb(57 121 232 / 10%);
    }

    &:disabled {
      background: #f8f9fb;
      cursor: not-allowed;
    }
  }
}

.password-wrapper {
  position: relative;

  input {
    padding-right: 70px;
  }
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  padding: 8px 4px;
  border: 0;
  color: #3979e8;
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    color: #1e55b6;
  }
}

.field-hint {
  color: #929baa;
  font-size: 11px;
}

// Error

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 9px;
  color: #b42318;
  background: #fff1f0;
  font-size: 13px;
  line-height: 1.6;
}

.error-icon {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  background: #dc5555;
  font-size: 11px;
  font-weight: 700;
}

.error-enter-active,
.error-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.error-enter-from,
.error-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

// Button

.submit-button {
  min-height: 51px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 3px;
  padding: 0 18px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  background: #2868d7;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;

  &:hover:not(:disabled) {
    background: #1e55b6;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.button-arrow {
  font-size: 19px;
  line-height: 1;
}

.loading-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgb(255 255 255 / 35%);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Footer

.auth-switch {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin: 27px 0 0;
  color: #7b8495;
  text-align: center;
  font-size: 13px;

  a {
    color: #2868d7;
    font-weight: 700;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 45px;
  color: #a0a8b5;
  text-align: center;
  font-size: 11px;
}

.footer-lock {
  font-size: 15px;
}

// Tablet

@media (max-width: 1100px) {
  .auth-page {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  }

  .auth-brand {
    padding: 45px 35px;
  }

  .brand-content {
    min-height: 600px;
  }

  .brand-message h1 {
    font-size: 37px;
  }

  .brand-footer {
    flex-direction: column;
  }

  .auth-form-section {
    padding: 45px 35px;
  }
}

// Mobile and small tablet

@media (max-width: 768px) {
  .auth-page {
    min-height: 100vh;
    display: block;
  }

  .auth-brand {
    display: none;
  }

  .auth-form-section {
    min-height: 100vh;
    align-items: flex-start;
    padding: 40px 28px;
  }

  .auth-form-wrapper {
    max-width: 460px;
    margin: auto;
  }

  .mobile-logo {
    display: block;
    margin-bottom: 45px;
  }

  .form-heading h2 {
    font-size: 30px;
  }
}

// Small mobile

@media (max-width: 480px) {
  .auth-form-section {
    padding: 28px 22px;
  }

  .mobile-logo {
    margin-bottom: 35px;
  }

  .form-heading {
    margin-bottom: 26px;

    h2 {
      font-size: 27px;
    }

    p {
      font-size: 13px;
    }
  }

  .auth-form {
    gap: 19px;
  }

  .name-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 19px;
  }

  .form-group input {
    height: 49px;
  }

  .submit-button {
    min-height: 50px;
  }

  .form-footer {
    margin-top: 38px;
  }
}

// Very small mobile

@media (max-width: 360px) {
  .auth-form-section {
    padding-right: 18px;
    padding-left: 18px;
  }

  .mobile-logo {
    margin-bottom: 30px;
  }

  .form-heading h2 {
    font-size: 24px;
  }
}
</style>
