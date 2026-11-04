const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// 외부 패키지나 실제 DB 없이 각 계층의 계약과 전달값을 검증합니다.
function load(relative, dependencies) {
  const filename = path.join(__dirname, "..", relative);
  const module = { exports: {} };
  const run = vm.runInThisContext("(function(require, module, exports) {" + fs.readFileSync(filename, "utf8") + "\n})", { filename });
  run(name => {
    if (!(name in dependencies)) throw new Error("Unexpected dependency: " + name);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const { createQuestionService } = load("src/services/questionService.js", { "../repositories/questionRepository": {} });
const { createQuestionRepository } = load("src/repositories/questionRepository.js", { "../config/db": {} });
const { createQuestionController } = load("src/controllers/questionController.js", { "../services/questionService": {} });

test("search trims whitespace and calculates third-page offset", async () => {
  const calls = [];
  const service = createQuestionService({ count: async keyword => { assert.equal(keyword, "JWT"); return 35; },
    findPage: async (...args) => { calls.push(args); return [{ id: 1 }]; } });
  assert.deepEqual(await service.list({ keyword: " JWT ", page: "3", size: "10" }), {
    items: [{ id: 1 }], pagination: { page: 3, size: 10, total: 35, totalPages: 4 }
  });
  assert.deepEqual(calls, [["JWT", 10, 20]]);
});

test("empty results and out-of-range page return empty items", async () => {
  for (const total of [0, 2]) {
    const service = createQuestionService({ count: async () => total, findPage: async () => assert.fail("unnecessary query") });
    const result = await service.list({ page: "2" });
    assert.deepEqual(result.items, []);
    assert.equal(result.pagination.totalPages, total === 0 ? 0 : 1);
  }
});

test("invalid inputs fail before querying DB", async () => {
  const service = createQuestionService({ count: async () => assert.fail("invalid input reached DB") });
  for (const query of [{page:"0"}, {page:"-1"}, {page:"1.5"}, {page:["1","2"]},
    {page:"9007199254740992"}, {page:"9007199254740991",size:"100"}, {size:"101"},
    {size:""}, {keyword:{}}, {keyword:"a".repeat(101)}, {sort:"views"}]) {
    await assert.rejects(service.list(query), error => error.status === 400);
  }
});

test("SQL binds literal wildcards and uses identical list/count conditions", async () => {
  const calls = [];
  const repo = createQuestionRepository({ execute: async (sql, values) => {
    calls.push({ sql, values });
    return sql.includes("SELECT COUNT(*) AS total") ? [[{ total: 1 }]] : [[{id:1,isSolved:0,answerCount:"2"}]];
  } });
  const keyword = "%' OR 1=1 --_!";
  assert.equal(await repo.count(keyword), 1);
  const rows = await repo.findPage(keyword, 10, 20);
  assert.equal(rows[0].isSolved, false);
  assert.equal(rows[0].answerCount, 2);
  assert.deepEqual(calls[1].values, [...calls[0].values,10,20]);
  for (const {sql,values} of calls) {
    assert.ok(!sql.includes(keyword));
    assert.ok(sql.includes("q.project_id IS NULL AND q.deleted_at IS NULL"));
    assert.ok(sql.includes("ESCAPE '!'"));
    assert.ok(values[0].includes("!%"));
    assert.ok(values[0].includes("!_"));
    assert.ok(values[0].includes("!!"));
  }
  assert.ok(calls[1].sql.includes("a.deleted_at IS NULL"));
});

test("controller wraps response and forwards errors unchanged", async () => {
  const data = {items:[]};
  let status, body;
  await createQuestionController({list:async () => data}).list({query:{}}, {
    status: code => { status=code; return {json:value => {body=value;}}; }
  }, () => assert.fail("unexpected error"));
  assert.equal(status,200);
  assert.deepEqual(body,{success:true,data,message:null});
  const failure = new Error("DB failed");
  let forwarded;
  await createQuestionController({list:async () => {throw failure;}}).list({query:{}},{}, error => {forwarded=error;});
  assert.equal(forwarded,failure);
});

test("router registers public GET / with list controller", () => {
  const {register} = load("src/routes/questionRouter.js", {express:{}, "../controllers/questionController":{}});
  const list = () => {};
  const router = {get:(...args) => assert.deepEqual(args,["/",list])};
  assert.equal(register(router,{list}),router);
});
