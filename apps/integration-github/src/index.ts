import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`GitHub Integration service listening on port ${PORT}`);
});
