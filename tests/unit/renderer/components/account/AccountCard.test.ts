import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import AccountCard from '@/renderer/components/account/AccountCard.vue';
import type { Account } from '@/renderer/stores/account';

// ── Element Plus stubs ──
const globalStubs = {
  'el-checkbox': {
    template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'change\', modelValue)" />',
    props: ['modelValue'],
    emits: ['change'],
  },
  'el-avatar': {
    template: '<div data-testid="el-avatar"><slot />{{ src ? "" : fallback }}</div>',
    props: ['size', 'src'],
    computed: { fallback() { return '?'; } },
  },
  'el-tag': {
    template: '<span data-testid="el-tag"><slot /></span>',
    props: ['type', 'size', 'effect', 'round'],
  },
  'el-icon': {
    template: '<span class="el-icon"><slot /></span>',
    props: ['size'],
  },
  'el-button': {
     template: '<button data-testid="el-btn" @click="$emit(\'click\', $event)"><slot /></button>',
    props: ['type', 'size', 'text', 'disabled'],
    emits: ['click'],
  },
  'el-tooltip': {
    template: '<span><slot /></span>',
    props: ['content', 'placement'],
  },
  'el-popconfirm': {
    template: '<div data-testid="el-popconfirm"><slot name="reference" /><slot /></div>',
    props: ['title'],
    emits: ['confirm'],
  },
  'el-popover': {
    template: '<div v-if="visible"><slot /></div>',
    props: ['visible'],
  },
  'el-input': true,
};

function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    platform: 'douyin',
    nickname: '测试账号',
    status: 'online',
    cookieValid: true,
    lastLogin: '2026-05-19',
    createdAt: '2026-01-01',
    ...overrides,
  };
}

function mountCard(overrides: Partial<Account> = {}) {
  const account = createAccount(overrides);
  return mount(AccountCard, {
    props: {
      account,
      groups: [
         { id: 'grp-1', name: '默认分组', color: '#409eff' },
         { id: 'grp-2', name: '其他分组', color: '#67c23a' },
      ],
    },
    global: { plugins: [createPinia()], stubs: globalStubs },
  });
}

describe('AccountCard', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // ── Basic rendering ──

  it('renders account nickname', () => {
    wrapper = mountCard({ nickname: '我的抖音号' });
    expect(wrapper.find('.account-card__name').text()).toBe('我的抖音号');
  });

  it('renders platform label for known platforms', () => {
    const cases: Array<[string, string]> = [
      ['douyin', '抖音'],
      ['xiaohongshu', '小红书'],
      ['channels', '视频号'],
      ['kuaishou', '快手'],
      ['bilibili', 'B站'],
    ];
    for (const [platform, label] of cases) {
      wrapper = mountCard({ platform });
      const tag = wrapper.find('.account-card__plat-tag');
      expect(tag.text()).toBe(label);
      wrapper.unmount();
    }
  });

  it('renders raw platform string for unknown platforms', () => {
    wrapper = mountCard({ platform: 'tiktok' });
    expect(wrapper.find('.account-card__plat-tag').text()).toBe('tiktok');
  });

  it('renders status label correctly', () => {
    const cases: Array<[Account['status'], boolean, string]> = [
      ['online', true, '在线'],
      ['offline', false, '离线'],
      ['expired', false, '离线'],
    ];
    for (const [status, cookieValid, label] of cases) {
      wrapper = mountCard({ status, cookieValid });
      expect(wrapper.find('.account-card__tag').text()).toContain(label);
      wrapper.unmount();
    }
  });

  it('renders online state when cookie is valid', () => {
    wrapper = mountCard({ cookieValid: true });
    expect(wrapper.find('.account-card__tag').text()).toContain('在线');
  });

  it('renders offline state when cookie is invalid', () => {
    wrapper = mountCard({ cookieValid: false });
    expect(wrapper.find('.account-card__tag').text()).toContain('离线');
  });

  // ── Conditional rendering ──

  it('shows assigned group names', () => {
    wrapper = mountCard({ groupInfos: [{ id: 'grp-1', name: '默认分组', color: '#409eff' }] });
    expect(wrapper.find('.account-card__group-chip').exists()).toBe(true);
    expect(wrapper.find('.account-card__group-chip').text()).toContain('默认分组');
  });

  it('hides group section when account has no groupId', () => {
    wrapper = mountCard();
    expect(wrapper.find('.account-card__group-chip').exists()).toBe(false);
  });

  it('shows fingerprint binding tag when fingerprintId is set', () => {
    wrapper = mountCard({ fingerprintId: 'fp-1' });
    expect(wrapper.text()).toContain('指纹已设');
  });

  it('shows proxy binding tag when proxyId is set', () => {
    wrapper = mountCard({ proxyId: 'px-1' });
    expect(wrapper.text()).toContain('代理已设');
  });

  it('hides bindings section when no bindings', () => {
    wrapper = mountCard();
    expect(wrapper.text()).not.toContain('指纹已设');
    expect(wrapper.text()).not.toContain('代理已设');
  });

  // ── CSS classes ──

  it('renders expired accounts as offline', () => {
    wrapper = mountCard({ status: 'expired', cookieValid: false });
    expect(wrapper.find('.account-card__tag').text()).toContain('离线');
  });

  it('emits settings when the settings action is clicked', async () => {
    wrapper = mountCard();
    const settingsButton = wrapper.findAll('[data-testid="el-btn"]')[0];
    expect(settingsButton.exists()).toBe(true);
    await settingsButton.trigger('click');
    expect(wrapper.emitted('settings')).toEqual([['acc-1']]);
  });

  it('renders lastLogin time', () => {
    wrapper = mountCard({ lastLogin: '2026-05-19 10:00' });
    expect(wrapper.findAll('.account-card__info-val')[1].text()).toContain('2026-05-19 10:00');
  });

  it('falls back to creation time when lastLogin is empty', () => {
    wrapper = mountCard({ lastLogin: undefined });
    expect(wrapper.findAll('.account-card__info-val')[1].text()).toContain('2026-01-01');
  });
});
