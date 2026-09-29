import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import MultiPanel from '@/renderer/views/MultiPanel.vue';

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/renderer/stores/panel', () => ({
  usePanelStore: () => ({
    panels: [],
    availableAccounts: [
      { id: 'a1', platform: 'douyin', nickname: '抖音号' },
      { id: 'a2', platform: 'xiaohongshu', nickname: '小红书号' },
    ],
    focusedPanelId: null,
    maxPanels: 10,
    loadAvailableAccounts: vi.fn().mockResolvedValue(undefined),
    loadPanels: vi.fn().mockResolvedValue(undefined),
    openPanel: vi.fn().mockResolvedValue(null),
    closePanel: vi.fn(),
    focusPanel: vi.fn(),
    hideAllPanels: vi.fn().mockResolvedValue(undefined),
    showAllPanels: vi.fn().mockResolvedValue(undefined),
  }),
}));

const globalStubs = {
  PanelSidebar: {
    template: '<aside data-testid="panel-sidebar" />',
    props: ['accounts', 'activePanelIds', 'loading'],
  },
  BrowserTabs: {
    template: '<div data-testid="browser-tabs" />',
    props: ['panels', 'activePanelId'],
  },
  BrowserContent: {
    template: '<div data-testid="browser-content" />',
    props: ['panel'],
  },
  'el-select': {
    template: '<select data-testid="el-select"><slot /></select>',
    props: ['modelValue', 'placeholder', 'style', 'disabled'],
    emits: ['update:modelValue'],
  },
  'el-option': {
    template: '<option data-testid="el-option"><slot /></option>',
    props: ['label', 'value', 'key'],
  },
  'el-button': {
    template: '<button data-testid="el-btn" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'size', 'text', 'disabled'],
    emits: ['click'],
  },
  'el-icon': { template: '<span><slot /></span>', props: ['size'] },
  Monitor: { template: '<span>monitor</span>' },
  Grid: { template: '<span>grid</span>' },
};

function mountView() {
  return mount(MultiPanel, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
      ],
      stubs: globalStubs,
    },
  });
}

describe('MultiPanel', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders multi-panel-view container', () => {
    wrapper = mountView();
    expect(wrapper.find('.multi-panel-view').exists()).toBe(true);
  });

  it('renders the panel sidebar and workspace', () => {
    wrapper = mountView();
    expect(wrapper.find('[data-testid="panel-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('.workspace').exists()).toBe(true);
  });

  it('renders the empty workspace state', () => {
    wrapper = mountView();
    expect(wrapper.find('.workspace__empty').exists()).toBe(true);
    expect(wrapper.find('.workspace__empty-title').text()).toContain('选择账号');
    expect(wrapper.find('.workspace__empty-features').text()).toContain('10');
  });

  it('does not show panel tabs when no panels open', () => {
    wrapper = mountView();
    expect(wrapper.find('[data-testid="browser-tabs"]').exists()).toBe(false);
  });

  it('does not show panel content when no panels open', () => {
    wrapper = mountView();
    expect(wrapper.find('[data-testid="browser-content"]').exists()).toBe(false);
  });
});
