<script setup lang="ts">
const props = defineProps<{
    avatarUrl: string | null
    uploading: boolean
    removing: boolean
}>()

const emit = defineEmits<{
    upload: [file: File]
    remove: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const isBusy = computed(
    () => props.uploading || props.removing,
)

function openFilePicker() {
    if (!isBusy.value) {
        fileInput.value?.click()
    }
}

function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and WebP images are allowed.')
        input.value = ''
        return
    }

    if (file.size > 2 * 1024 * 1024) {
        alert('Avatar must not exceed 2MB.')
        input.value = ''
        return
    }

    emit('upload', file)
    input.value = ''
}
</script>

<template>
    <div class="avatar-upload">
        <div class="avatar-preview">
            <img v-if="avatarUrl" :src="avatarUrl" alt="User avatar" />

            <Icon v-else name="lucide:user-round" size="32" />
        </div>

        <div class="avatar-actions">
            <strong>Profile Avatar</strong>

            <p>JPEG, PNG or WebP. Maximum size 2MB.</p>

            <div class="avatar-buttons">
                <button type="button" :disabled="isBusy" @click="openFilePicker">
                    {{ uploading ? 'Uploading...' : 'Upload Avatar' }}
                </button>

                <button v-if="avatarUrl" type="button" class="remove-button" :disabled="isBusy" @click="emit('remove')">
                    {{ removing ? 'Removing...' : 'Remove' }}
                </button>
            </div>

            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden
                @change="handleFileChange" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.avatar-upload {
    display: flex;
    align-items: center;
    gap: 18px;
}

.avatar-preview {
    width: 88px;
    height: 88px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    background: #f9fafb;
    color: #9ca3af;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: 2px solid #e5e7eb;
        box-shadow: 0 0 0 3px #f9fafb;
    }
}

.avatar-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;

    strong {
        color: #111827;
        font-size: 13px;
    }

    p {
        margin: 0;
        color: #737373;
        font-size: 12px;
    }
}

.avatar-buttons {
    display: flex;
    gap: 8px;
    margin-top: 4px;

    button {
        padding: 7px 12px;
        border: 1px solid #2563eb;
        border-radius: 6px;
        background: #2563eb;
        color: #fff;
        font-size: 12px;
        cursor: pointer;

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    .remove-button {
        border-color: #fecaca;
        background: #fff;
        color: #b91c1c;
    }
}
</style>
