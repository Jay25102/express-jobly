"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function() {
    const newJob = {
        title: "new job at c1",
        salary: 5000,
        equity: "0",
        company_handle: "c1"
    };

    test("works", async function() {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(`
           SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new job at c1' 
        `);
        expect(result.rows).toEqual([
            {
                title: "new job at c1",
                salary: 5000,
                equity: "0",
                company_handle: "c1"
            }
        ]);
    });

    test("bad request with dupe", async function() {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("bad request with non-existing company", async function() {
        try {
            await Job.create({
                title: "new job at nope",
                salary: 5000,
                equity: "0",
                company_handle: "nope"
            });
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function() {
    test("works: no filter", async function() {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: "Job1",
                salary: 100,
                equity: "0.1",
                company_handle: "c1"
            },
            {
                title: "Job2",
                salary: 200,
                equity: "0.2",
                company_handle: "c1"
            },
            {
                title: "Job3",
                salary: 300,
                equity: "0.3",
                company_handle: "c1"
            },
            {
                title: "Job4",
                salary: 400,
                equity: "0.4",
                company_handle: "c1"
            },
        ]);
    });
});

/************************************** get */

describe("get", function() {
    test("works", async function () {
        let job = await Job.get(testJobIds[0]);
        expect(job).toEqual({
            id: testJobIds[0],
            title: "Job1",
            salary: 100,
            equity: "0.1",
            company: {
                handle: "c1",
                name: "C1",
                description: "Desc1",
                numEmployees: 1,
                logoUrl: "http://c1.img",
            },
        });
      });
    
      test("not found if no such job", async function () {
        try {
          await Job.get(-1);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
});

/************************************** update */

describe("update", function() {
    const updateData = {
        title: "NewJob",
        salary: 500,
        equity: "0.5"
      };

    test("works", async function() {
        let newJob = await Job.update(testJobIds[0], updateData);
        expect(newJob).toEqual({
            id: testJobIds[0],
            company_handle: "c1",
            ...updateData,
        });

        const result = await db.query(`
            SELECT title, salary, equity, company_handle
            FROM jobs
            WHERE id = ${testJobIds[0]}
        `);
        expect(result.rows).toEqual([
            {
                title: "NewJob",
                salary: 500,
                equity: "0.5",
                company_handle: "c1",
            },
        ]);
    });

    test("works: null fields", async function() {
        const updateDataSetNulls = {
            title: "NewJob",
            salary: null,
            equity: null,
            company_handle: "c1",
          };
      
        let job = await Job.update(testJobIds[0], updateDataSetNulls);
          expect(job).toEqual({
            id: testJobIds[0],
            company_handle: "c1",
            ...updateDataSetNulls,
          });
      
        const result = await db.query(`
            SELECT title, salary, equity, company_handle
            FROM jobs
            WHERE id = ${testJobIds[0]}
        `);
        expect(result.rows).toEqual([
            {
                title: "NewJob",
                salary: null,
                equity: null,
                company_handle: "c1",
            },
        ]);
    });

    test("not found if no such job", async function() {
        try {
            await Job.update(-1, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function() {
        try {
            await Job.update(testJobIds[0], {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function() {
    test("works", async function() {
        await Job.remove(testJobIds[0]);
        const res = await db.query(`
            SELECT id FROM jobs WHERE id = ${testJobIds[0]}
        `);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function() {
        try {
            await Job.remove(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});