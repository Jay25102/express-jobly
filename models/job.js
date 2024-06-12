"use strict";

const db = require("../db");
const { BadRequestError, ExpressError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/* Related functions for jobs */

class Job {
    /** Create a job (from data), update db, return new job data.
     * 
     * data should be { title, salary, equity, company_handle }
     * 
     * Returns { title, salary, equity, company_handle }
     * 
     * Throws BadRequestError if job already exists
     */
    static async create({ title, salary, equity, company_handle }) {
        const duplicateCheck = await db.query(
            `SELECT title
             FROM jobs
             WHERE title = $1`,
          [title]);
  
      if (duplicateCheck.rows[0])
        throw new BadRequestError(`Duplicate job: ${title}`);

      const companyExists = await db.query(`
            SELECT handle
            FROM companies
            WHERE handle = $1
        `, [company_handle]);

        if (companyExists.rows[0] === undefined) {
            throw new BadRequestError(`Cannot make a request for a non-existing company: ${company_handle}`);
        }

      const result = await db.query(`
        INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING title, salary, equity, company_handle
        `, [title, salary, equity, company_handle]);

        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     * 
     * Returns [{ title, salary, equity, company_handle}, ...]
     */
    static async findAll() {
        let query = `SELECT title, salary, equity, company_handle
                    FROM jobs`;

        const jobsRes = await db.query(query);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     * 
     * Returns { title, salary, equity, company_handle, company }
     *  where company is { handle, name, description, numEmployees, logoUrl }
     * 
     * Throws NotFoundError if not found.
     * 
     */
    static async get(id) {
        const jobRes = await db.query(`
            SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = $1
            `, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(`
            SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1
            `, [job.company_handle]);

        delete job.company_handle;
        job.company = companiesRes.rows[0];

        return job;
    }

    /** Update job data with `data`.
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all
     * the fields; this only changes provided ones.
     * 
     * Data can include: { title, salary, equity }
     * 
     * Returns { id, title, salary, equity, company_handle }
     * 
     * Throws NotFoundError if not found.
     */
    static async update(id, data) {
        const {setCols, values } = sqlForPartialUpdate(
            data, {}
        );
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${idVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     * 
     * Throws NotFoundError if job not found.
     */
    static async remove(id) {
        const result = await db.query(`
            DELETE FROM jobs
            WHERE id = ${id}
            RETURNING id
        `);
        const job = result.rows[0];
        
        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;