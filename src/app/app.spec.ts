import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Starship } from '../models/starship';

describe('App', () => {
  it('accepts name edit only when Enter is pressed', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;

    const starship = { name: 'Old name' } as Starship;

    component.nameDraft = 'New name';

    component.completeEdit(new KeyboardEvent('keydown', { key: 'Escape' }), starship);
    expect(starship.name).toBe('Old name');

    component.completeEdit(new KeyboardEvent('keydown', { key: 'Enter' }), starship);
    expect(starship.name).toBe('New name');
  });
});
