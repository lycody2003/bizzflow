
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { BarcodeType } from '@app-types/product'

const props = defineProps<{
  value: string
  type: BarcodeType
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const error = ref(false)

const barcodeFormats: Record<BarcodeType, string> = {
  CODE128: 'code128',
  EAN13: 'ean13',
  UPC: 'upca',
  EAN8: 'ean8',
  QR: 'qrcode',
}

async function renderBarcode() {
  if (!canvas.value) return

  error.value = false
  canvas.value.width = 0
  canvas.value.height = 0

  if (!props.value) return

  try {
    const bwipjs = await import('bwip-js/browser')

    bwipjs.default.toCanvas(canvas.value, {
      bcid: barcodeFormats[props.type],
      text: props.value,
      scale: 2,
      height: 14,
      includetext: false,
      padding: 0,
    })
  } catch (err) {
    console.error('Barcode generation failed:', err)
    error.value = true
  }
}

onMounted(renderBarcode)

watch(
  () => [props.value, props.type],
  renderBarcode,
)
</script>

<template>
  <div class="product-barcode">
    <template v-if="type !== 'QR'">
      <canvas v-show="!error" ref="canvas" />

      <span v-if="!error" class="barcode-number">
        {{ value }}
      </span>
    </template>

    <canvas v-else ref="canvas" />

    <span v-if="error" class="barcode-error">
      Unable to generate barcode
    </span>
  </div>
</template>

<style lang="scss" scoped>
.product-barcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 180px;
  min-height: 58px;

  canvas {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .barcode-number {
    color: #374151;
    font-family: monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1px;
    line-height: 1.2;
  }

  .barcode-error {
    color: #dc2626;
    font-size: 12px;
  }
}
</style>
