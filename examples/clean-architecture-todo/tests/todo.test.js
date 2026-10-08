import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTodo,
  toggleTodo,
  CreateTodoUseCase,
  ListTodosUseCase,
  InMemoryTodoRepository
} from '../src/index.js';

test('Domain Entity: creates valid todo with default completed = false', () => {
  const todo = createTodo({ id: 'todo-1', title: 'Test architectural purity', now: 1000 });
  assert.strictEqual(todo.id, 'todo-1');
  assert.strictEqual(todo.title, 'Test architectural purity');
  assert.strictEqual(todo.completed, false);
  assert.strictEqual(todo.createdAt, 1000);
});

test('Domain Entity: rejects empty title with clear error', () => {
  assert.throws(
    () => createTodo({ id: 'todo-2', title: '   ' }),
    /cannot be empty/i
  );
});

test('Domain Entity: toggles completed state immutably', () => {
  const original = createTodo({ id: 'todo-3', title: 'Toggle test', now: 1000 });
  const toggled = toggleTodo(original);
  assert.strictEqual(toggled.completed, true);
  assert.strictEqual(original.completed, false);
});

test('Use Case: CreateTodoUseCase persists and retrieves via repository port', async () => {
  const repo = new InMemoryTodoRepository();
  const clock = { now: () => 1700000000000 };
  const useCase = new CreateTodoUseCase(repo, clock);

  const created = await useCase.execute({ id: 't-10', title: 'Hexagonal separation' });
  assert.strictEqual(created.id, 't-10');

  const retrieved = await repo.findById('t-10');
  assert.deepStrictEqual(retrieved, created);

  const listUseCase = new ListTodosUseCase(repo);
  const all = await listUseCase.execute();
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0]?.title, 'Hexagonal separation');
});
