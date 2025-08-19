const app = express();
var helmet = require('helmet');
app.use(helmet());
app.use(helmet.hsts({
  maxAge: 300,
  includeSubDomains: true,
  preload: true
}));

app.use((req, res) => {
  res.send("Hello secure web!");
});