/**
 * Chế độ kiểm thử: chỉ bật khi URL có ?test=1. Dùng bộ lưu riêng (khóa có hậu tố "_test"),
 * không bao giờ đọc hay ghi tiến trình thật.
 */
export const TEST_MODE = (() => {
  try {
    return new URLSearchParams(window.location.search).get('test') === '1';
  } catch {
    return false;
  }
})();

/** Tùy chọn của bảng công cụ kiểm thử (chỉ có tác dụng khi TEST_MODE) */
export const TestOpts = {
  infiniteO2: false,
};
