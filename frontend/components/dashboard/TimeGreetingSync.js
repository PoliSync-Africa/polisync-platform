"use client";

import { useEffect } from "react";
import { getTimeGreeting } from "./timeGreeting";

const GREETING_PATTERN = /Good (Morning|Afternoon|Evening|Night)/gi;

export default function TimeGreetingSync() {
  useEffect(() => {
    const update = () => {
      const greeting = getTimeGreeting(new Date());
      document.querySelectorAll(".polisync-dashboard").forEach((root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while ((node = walker.nextNode())) nodes.push(node);
        nodes.forEach((textNode) => {
          if (!textNode.nodeValue || !GREETING_PATTERN.test(textNode.nodeValue)) {
            GREETING_PATTERN.lastIndex = 0;
            return;
          }
          GREETING_PATTERN.lastIndex = 0;
          textNode.nodeValue = textNode.nodeValue.replace(GREETING_PATTERN, greeting);
          GREETING_PATTERN.lastIndex = 0;
        });
      });
    };

    update();
    const timer = window.setInterval(update, 1000);
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
