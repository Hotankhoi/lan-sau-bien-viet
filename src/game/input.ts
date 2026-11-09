/** Trạng thái điều khiển chung cho bàn phím/chuột và cảm ứng. */
export const Input = {
  moveX: 0,
  moveY: 0,
  /** joystick ảo */
  stickX: 0,
  stickY: 0,
  sprint: false,
  aim: false,
  /** yêu cầu chụp (một lần) */
  shoot: false,
  scan: false,
  lampToggle: false,
  surfaceHold: false,
  usingTouch: false,
  /** vị trí con trỏ chuột (CSS px) và thời điểm di chuyển gần nhất */
  pointerX: 0,
  pointerY: 0,
  pointerMovedAt: 0,
  paused: false,
  /** đang ngắm bằng phím Space (nhả Space = chụp) */
  aimFromSpace: false,
};
