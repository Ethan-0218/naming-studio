import React, { useEffect, useState } from 'react';
import SimpleMarkdown from './SimpleMarkdown';

interface Props {
  text: string;
  animate: boolean;
  msPerChar?: number;
  onDone?: () => void;
}

export default function TypewriterText({
  text,
  animate,
  msPerChar = 50,
  onDone,
}: Props) {
  const [displayed, setDisplayed] = useState(animate ? '' : text);

  useEffect(() => {
    if (!animate) {
      setDisplayed(text);
      onDone?.();
      return;
    }

    setDisplayed('');
    let index = 0;

    const timer = setInterval(() => {
      index++;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, msPerChar);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, animate]);

  return <SimpleMarkdown text={displayed} />;
}
