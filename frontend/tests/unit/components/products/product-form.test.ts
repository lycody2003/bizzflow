
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest'

import { mount } from '@vue/test-utils'

import ProductForm from '../../../../app/components/products/ProductForm.vue'

describe('ProductForm - Object URL Lifecycle', () => {
  let createObjectURL: ReturnType<typeof vi.spyOn>
  let revokeObjectURL: ReturnType<typeof vi.spyOn>

  let createdUrls: string[]

  beforeEach(() => {
    createdUrls = []

    createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => {
        const url = `blob:test-${createdUrls.length + 1}`

        createdUrls.push(url)

        return url
      })

    revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createWrapper() {
    return mount(ProductForm, {
      props: {
        businessId: 'business-1',
        submitting: false,
      },
    })
  }

  function createImageFile(
    name = 'product.png',
  ) {
    return new File(
      [
        new Uint8Array([
          0x89, 0x50, 0x4E, 0x47,
          0x0D, 0x0A, 0x1A, 0x0A,
        ]),
      ],
      name,
      {
        type: 'image/png',
      },
    )
  }

  async function selectImage(
    wrapper: ReturnType<typeof createWrapper>,
    file: File,
  ) {
    const input = wrapper.get('input[type="file"]')

    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })

    await input.trigger('change')
  }

  it('should create an object URL when selecting an image', async () => {
    const wrapper = createWrapper()

    const file = createImageFile()

    await selectImage(wrapper, file)

    expect(createObjectURL).toHaveBeenCalledWith(file)

    expect(wrapper.get('img').attributes('src')).toBe(
      'blob:test-1',
    )

    wrapper.unmount()
  })

  it('should revoke the previous URL when replacing an image', async () => {
    const wrapper = createWrapper()

    await selectImage(wrapper, createImageFile())

    await selectImage(
      wrapper,
      createImageFile('replacement.png'),
    )

    expect(revokeObjectURL).toHaveBeenCalledWith(
      'blob:test-1',
    )

    expect(wrapper.get('img').attributes('src')).toBe(
      'blob:test-2',
    )

    wrapper.unmount()
  })

  it('should revoke the current URL when removing an image', async () => {
    const wrapper = createWrapper()

    await selectImage(wrapper, createImageFile())

    await wrapper.get('.remove-image-button').trigger('click')

    expect(revokeObjectURL).toHaveBeenCalledWith(
      'blob:test-1',
    )

    expect(wrapper.find('img').exists()).toBe(false)

    wrapper.unmount()
  })

  it('should revoke the current URL when unmounting the component', async () => {
    const wrapper = createWrapper()

    await selectImage(wrapper, createImageFile())

    wrapper.unmount()

    expect(revokeObjectURL).toHaveBeenCalledWith(
      'blob:test-1',
    )
  })

  it('should not create an object URL for an unsupported file', async () => {
    const wrapper = createWrapper()

    const file = new File(
      ['document'],
      'document.gif',
      {
        type: 'image/gif',
      },
    )

    await selectImage(wrapper, file)

    expect(createObjectURL).not.toHaveBeenCalled()

    expect(wrapper.text()).toContain(
      'Only JPG, PNG, and WebP images are allowed.',
    )

    wrapper.unmount()
  })
})
