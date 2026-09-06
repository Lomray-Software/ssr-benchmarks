import type { ReactNode } from 'react';
import Counter from './counter';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div id="benchmark-app">
      <header>
        <nav aria-label="Main navigation">
          <a data-vike="false" href="/">
            Home
          </a>
          <a data-vike="false" href="/items">
            Items
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function Home() {
  return (
    <section data-bench-ready="">
      <h1>SSR benchmark</h1>
      <p>A small React application with server-rendered data.</p>
      <Counter />
    </section>
  );
}

export function Items({ items }: { items: { id: number; name: string }[] }) {
  return (
    <section data-bench-ready="">
      <h1>Items</h1>
      <p>50 items, loaded on the server.</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a data-vike="false" href={`/items/${item.id}`}>
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Detail({ name, children }: { name: string; children: ReactNode }) {
  return (
    <article>
      <h1>{name}</h1>
      <p data-bench-immediate="">Available immediately.</p>
      {children}
    </article>
  );
}

export function Pending() {
  return <p data-bench-pending="">Loading details…</p>;
}

export function Deferred({ value }: { value: string }) {
  return (
    <p data-bench-deferred="" data-bench-ready="">
      {value}
    </p>
  );
}
