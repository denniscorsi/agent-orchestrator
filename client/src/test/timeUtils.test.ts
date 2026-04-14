import { relativeTime } from '../timeUtils';

describe('relativeTime', () => {
  it('returns "Never" for null', () => {
    expect(relativeTime(null)).toBe('Never');
  });

  it('returns "just now" for times less than a minute ago', () => {
    const now = new Date().toISOString();
    expect(relativeTime(now)).toBe('just now');
  });

  it('returns minutes for times less than an hour ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours for times less than a day ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "1 day ago" for times about 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(oneDayAgo)).toBe('1 day ago');
  });

  it('returns days for times less than a month ago', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(fiveDaysAgo)).toBe('5 days ago');
  });

  it('returns months for times over 30 days ago', () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(twoMonthsAgo)).toBe('2 months ago');
  });

  it('returns "just now" for future timestamps', () => {
    const future = new Date(Date.now() + 60 * 1000).toISOString();
    expect(relativeTime(future)).toBe('just now');
  });
});
