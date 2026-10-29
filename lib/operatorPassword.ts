// Design Ref: DESIGN.md §9 접근 보호 — 운영자 비밀번호를 이 브라우저 탭 안에서만 기억한다.
// sessionStorage라서 탭(창)을 닫으면 사라지고, 다른 탭·다른 컴퓨터와 공유되지 않는다. 서버에는 요청마다 헤더로만 보낸다.
const STORAGE_KEY = "cheongseolmo-operator-password";

export function getOperatorPassword(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // 개인정보 보호 모드 등에서 저장소를 못 쓰면 매번 입력하게 된다
    return "";
  }
}

export function setOperatorPassword(password: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, password);
  } catch {
    // 저장하지 못해도 이번 요청에는 쓸 수 있다
  }
}

export function clearOperatorPassword(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지울 것이 없다
  }
}
