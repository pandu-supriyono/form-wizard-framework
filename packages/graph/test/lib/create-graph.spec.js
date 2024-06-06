const createGraph = require('../../lib/create-graph');
const graphlib = require('@dagrejs/graphlib');

describe('createGraph', () => {
  test('should throw an error for invalid form definition', () => {
    expect(() => createGraph()).toThrow('Invalid form definition');
    expect(() => createGraph(null)).toThrow('Invalid form definition');
    expect(() => createGraph('form')).toThrow('Invalid form definition');
    expect(() => createGraph(123)).toThrow('Invalid form definition');
  });

  test('should create a graph for valid form definition', () => {
    const form = {
      '/start': {
        next: 'step1',
      },
      '/step1': {
        next: 'step2',
      },
      '/step2': {
        next: 'step3',
      },
      '/step3': {
        next: 'step4',
      },
    };

    const graph = graphlib.json.write(createGraph(form));

    expect(graph.nodes).toEqual([
      {
        v: '/start',
      },
      {
        v: '/step1',
      },
      {
        v: '/step2',
      },
      {
        v: '/step3',
      },
      {
        v: '/step4',
      },
    ]);

    expect(graph.edges).toEqual([
      { v: '/start', w: '/step1' },
      { v: '/step1', w: '/step2' },
      { v: '/step2', w: '/step3' },
      { v: '/step3', w: '/step4' },
    ]);
  });

  test('should handle next step conditions', () => {
    const form = {
      '/start': {
        next: {
          field: 'age',
          value: 18,
          op: '>=',
          next: 'adult',
        },
      },
      '/adult': {},
    };

    const graph = graphlib.json.write(createGraph(form));

    expect(graph.edges).toEqual([
      { v: '/start', w: '/adult', value: 'age >= 18' },
    ]);
  });

  test('should handle nested next steps', () => {
    const form = {
      '/start': {
        next: [
          [
            {
              field: 'age',
              value: 18,
              op: '>=',
              next: 'adult',
            },
            {
              field: 'age',
              value: 13,
              op: '>=',
              next: 'teen',
            },
          ],
        ],
      },
      '/adult': {},
      '/teen': {},
    };

    const graph = graphlib.json.write(createGraph(form));

    expect(graph.edges).toEqual([
      { v: '/start', w: '/adult', value: 'age >= 18' },
      { v: '/start', w: '/teen', value: 'age >= 13' },
    ]);
  });

  test('should handle named functions as next step conditions', () => {
    function goToNext() {
      return true;
    }

    const form = {
      '/start': {
        next: {
          fn: goToNext,
          next: 'step1',
        },
      },
      '/step1': {},
    };

    const graph = graphlib.json.write(createGraph(form));

    expect(graph.edges).toEqual([
      {
        v: '/start',
        w: '/step1',
        value: 'goToNext',
      },
    ]);
  });

  test('should handle controller methods as next step conditions', () => {
    class Controller {
      goToNext() {
        return true;
      }
    }

    const form = {
      '/start': {
        next: {
          fn: Controller.prototype.goToNext,
          next: 'step1',
        },
      },
      '/step1': {},
    };

    const graph = graphlib.json.write(createGraph(form));

    expect(graph.edges).toEqual([
      {
        v: '/start',
        w: '/step1',
        value: 'goToNext',
      },
    ]);
  });

  it('should handle named functions as next step operators', () => {
    function isBar() {
      return 'bar';
    }

    const form = {
      '/start': {
        next: {
          field: 'foo',
          op: isBar,
          value: 'bar',
          next: 'step1',
        },
      },
      '/step1': {},
    };

    const graph = graphlib.json.write(createGraph(form));

    expect(graph.edges).toEqual([
      {
        v: '/start',
        w: '/step1',
        value: 'isBar',
      },
    ]);
  });
});
