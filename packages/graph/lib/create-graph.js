const graphlib = require('@dagrejs/graphlib');

function createGraph(form) {
  if (!form || typeof form !== 'object') {
    throw new Error('Invalid form definition');
  }

  const nodes = Object.keys(form);
  const g = new graphlib.Graph();

  nodes.forEach((node) => {
    g.setNode(node);

    const stepDefinition = form[node];

    const { next } = stepDefinition;

    if (next) {
      walkNextSteps(g, node, form);
    }
  });

  return g;
}

function walkNextSteps(g, nodeName, form) {
  const node = form[nodeName];

  if (!node.next) {
    return;
  }

  if (typeof node.next === 'string') {
    g.setEdge(nodeName, `/${node.next}`);

    return;
  }

  if (isRecord(node.next)) {
    const { field, value, op = '=', next, fn } = node.next;

    if (fn && typeof fn === 'function') {
      if (!fn.name) {
        console.error(
          'Functions as part of a next step condition has not yet been implemented'
        );

        return;
      }

      g.setEdge(nodeName, `/${next}`, fn.name);

      return;
    }

    if (typeof op === 'function') {
      if (!op.name) {
        console.error(
          'Operators that are functions has not yet been implemented'
        );

        return;
      }

      g.setEdge(nodeName, `/${next}`, op.name);

      return;
    }

    g.setEdge(nodeName, `/${next}`, `${field} ${op} ${value}`);
  }

  if (Array.isArray(node.next)) {
    node.next.forEach((nextStepCondition) => {
      if (Array.isArray(nextStepCondition)) {
        nextStepCondition.forEach((condition) => {
          walkNextSteps(g, nodeName, {
            ...form,
            [nodeName]: {
              ...form[nodeName],
              next: condition,
            },
          });
        });

        return;
      }
    });
  }
}

function isRecord(obj) {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    Object.keys(obj).length > 0
  );
}

module.exports = createGraph;
