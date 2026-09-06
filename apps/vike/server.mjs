import express from 'express';
import { renderPage } from 'vike/server';

const app = express();

app.use(express.static('dist/client'));
app.use(async (req, res, next) => {
  try {
    const { httpResponse } = await renderPage({
      urlOriginal: req.originalUrl,
      headersOriginal: req.headers,
    });

    if (!httpResponse) return next();

    res.status(httpResponse.statusCode);
    for (const [name, value] of httpResponse.headers) res.setHeader(name, value);
    httpResponse.pipe(res);
  } catch (error) {
    next(error);
  }
});
app.listen(Number(process.env.PORT || 3000));
