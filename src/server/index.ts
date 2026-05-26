import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { api } from './routes/api';
import { forms } from './routes/forms';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';

const app = new Hono();
const internal = new Hono();

console.log('[RuleWatch] Server initializing');

internal.route('/menu', menu);
internal.route('/form', forms);
internal.route('/triggers', triggers);

app.route('/api', api);
app.route('/internal', internal);

console.log('[RuleWatch] Routes mounted: /internal/menu, /internal/form, /internal/triggers, /api');

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
