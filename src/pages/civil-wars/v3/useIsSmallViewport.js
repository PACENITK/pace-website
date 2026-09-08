import { useEffect, useState } from "react";

// Gate on viewport width, not user-agent sniffing -- a narrow browser
// window on a laptop should also see the "use a laptop" message, and
// a large external monitor on a phone (unlikely at this event, but
// cheap to get right) shouldn't be blocked. 1024px matches the design
// handoff's minimum column widths for the three-panel layout.
const QUERY = "(max-width: 1023px)";

export default function useIsSmallViewport() {
  const [isSmall, setIsSmall] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsSmall(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isSmall;
}
