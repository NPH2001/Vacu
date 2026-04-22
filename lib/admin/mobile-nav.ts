'use client';
import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return open;
}

function getServerSnapshot(): boolean {
  return false;
}

export function setMobileNavOpen(value: boolean): void {
  if (open === value) return;
  open = value;
  emit();
}

export function useMobileNav(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
