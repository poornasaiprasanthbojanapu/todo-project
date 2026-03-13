'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FilterType } from '@/types/todo';
import { Profile } from '@/types/profile';
import ProfileBadge from './ProfileBadge';

interface GroceryItem {
  id: string;
  text: string;
  quantity?: string;
  completed: boolean;
  created_at: string;
  profile_id: string;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

interface ItemRowProps {
  item: GroceryItem;
  isDeleting: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

function ItemRow({ item, isDeleting, onToggle, onDelete }: ItemRowProps) {
  const [bouncing, setBouncing] = useState(false);

  const handleToggle = () => {
    if (!item.completed) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 300);
    }
    onToggle(item.id, item.completed);
  };

  return (
    <div
      data-testid="todo-item"
      className={`flex items-center gap-3 px-4 sm:px-6 py-4 group border-b last:border-0 transition-all duration-300 ${
        item.completed
          ? 'border-[var(--item-border)] bg-[var(--item-completed-bg)]'
          : 'border-[var(--item-border)] hover:bg-[var(--item-hover)]'
      } ${isDeleting ? 'animate-slide-out' : 'animate-slide-in'}`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
          item.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-[var(--text-muted)] hover:border-emerald-500'
        }`}
      >
        {item.completed && (
          <svg
            className={`w-3.5 h-3.5 text-white ${bouncing ? 'animate-check-bounce' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Item text */}
      <span
        className={`flex-1 text-base leading-relaxed transition-all duration-300 ${
          item.completed
            ? 'line-through font-light text-[var(--text-muted)]'
            : 'font-bold text-[var(--text-primary)]'
        }`}
      >
        {item.text}
      </span>

      {/* Quantity badge */}
      {item.quantity && (
        <span
          className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            item.completed
              ? 'text-[var(--text-muted)] bg-[var(--input-bg)] border-[var(--input-border)]'
              : 'text-emerald-600 bg-emerald-50 border-emerald-200'
          }`}
        >
          {item.quantity}
        </span>
      )}

      {/* Delete button — always visible on mobile, hover-reveal on desktop */}
      <button
        onClick={() => onDelete(item.id)}
        aria-label="Delete item"
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 sm:focus:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface TodoAppProps {
  profile: Profile;
  onSwitchProfile: () => void;
}

export default function TodoApp({ profile, onSwitchProfile }: TodoAppProps) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [quantityValue, setQuantityValue] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setItems(data as GroceryItem[]);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setItems([]);
    fetchItems();

    const channel = supabase
      .channel(`grocery:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_items',
          filter: `profile_id=eq.${profile.id}`,
        },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  const addTodo = async () => {
    const text = inputValue.trim();
    if (!text) return;
    const quantity = quantityValue.trim() || undefined;

    const tempId = `temp-${Date.now()}`;
    const tempItem: GroceryItem = {
      id: tempId,
      text,
      quantity,
      completed: false,
      created_at: new Date().toISOString(),
      profile_id: profile.id,
    };
    setItems(prev => [tempItem, ...prev]);
    setInputValue('');
    setQuantityValue('');
    inputRef.current?.focus();

    await supabase.from('grocery_items').insert({ text, quantity, completed: false, profile_id: profile.id });
  };

  const toggleTodo = async (id: string, currentCompleted: boolean) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !currentCompleted } : item))
    );
    await supabase
      .from('grocery_items')
      .update({ completed: !currentCompleted })
      .eq('id', id);
  };

  const deleteTodo = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    setTimeout(async () => {
      setItems(prev => prev.filter(item => item.id !== id));
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await supabase.from('grocery_items').delete().eq('id', id);
    }, 300);
  };

  const clearCompleted = async () => {
    setItems(prev => prev.filter(item => !item.completed));
    await supabase
      .from('grocery_items')
      .delete()
      .eq('completed', true)
      .eq('profile_id', profile.id);
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all items from the list?')) return;
    setItems([]);
    await supabase
      .from('grocery_items')
      .delete()
      .eq('profile_id', profile.id);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'active') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const remainingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--bg)] animate-fade-up">

      {/* Sticky header */}
      <header
        className="sticky top-0 z-10 border-b border-[var(--card-border)] px-4 sm:px-8 pt-5 pb-4"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-3xl mx-auto w-full">
          {/* Title row */}
          <div className="flex items-center justify-between mb-1">
            <ProfileBadge profile={profile} onSwitch={onSwitchProfile} />
            <div className="flex items-center gap-3">
              {totalCount > 0 && (
                <div
                  className="rounded-xl px-3 py-1.5 text-center"
                  style={{ background: 'var(--item-completed-bg)', border: '1px solid var(--item-border)' }}
                >
                  <span className="text-emerald-600 text-lg font-black leading-none">{remainingCount}</span>
                  <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wide">left</p>
                </div>
              )}
              {/* Theme toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-200 hover:scale-110"
                style={{ background: 'var(--item-hover)' }}
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {loading
              ? 'Loading...'
              : totalCount === 0
              ? 'Nothing here yet — add an item!'
              : `${completedCount} of ${totalCount} completed`}
          </p>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-3 rounded-full h-1.5" style={{ background: 'var(--item-border)' }}>
              <div
                className="bg-emerald-500 rounded-full h-1.5 transition-all duration-700 ease-out animate-progress-glow"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Input row */}
          <div className="flex gap-2 mt-4">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="Add an item..."
              className="flex-1 rounded-xl px-4 py-3 text-base font-semibold outline-none transition-all duration-200 min-w-0"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--input-border)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#10b981')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--input-border)')}
            />
            <input
              type="text"
              value={quantityValue}
              onChange={e => setQuantityValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="Qty"
              className="w-20 flex-shrink-0 rounded-xl px-3 py-3 text-base font-semibold outline-none transition-all duration-200 text-center"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--input-border)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#10b981')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--input-border)')}
            />
            <button
              onClick={addTodo}
              disabled={!inputValue.trim()}
              className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-xl text-base active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm tracking-wide"
            >
              Add
            </button>
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="border-b" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 flex">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-3.5 text-sm font-bold transition-all duration-200 relative focus:outline-none ${
                filter === key ? 'text-emerald-500' : 'hover:text-[var(--text-primary)]'
              }`}
              style={{ color: filter === key ? undefined : 'var(--text-secondary)' }}
            >
              {label}
              {filter === key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--card)' }}>
        <div className="max-w-3xl mx-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                Loading items...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--item-completed-bg)', border: '1px solid var(--item-border)' }}
              >
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-base font-bold" style={{ color: 'var(--text-secondary)' }}>
                {filter === 'all'
                  ? 'No items yet — add one above!'
                  : filter === 'active'
                  ? 'No active items.'
                  : 'No completed items.'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                isDeleting={deletingIds.has(item.id)}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      {items.length > 0 && (
        <footer
          className="border-t px-4 sm:px-8 py-3"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {completedCount} of {totalCount} completed
            </span>
            <div className="flex items-center gap-4">
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-xs font-semibold transition-colors duration-150 focus:outline-none hover:text-emerald-500"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Clear completed
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors duration-150 focus:outline-none"
              >
                Clear all
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
