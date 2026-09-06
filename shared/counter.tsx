'use client';
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button type="button" data-bench-counter="" onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}
