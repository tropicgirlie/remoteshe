Use the existing UI design already created in this Figma file. Do not redesign or modify layouts, typography, spacing, or visual hierarchy. Implement functionality and data connections based on the existing interface.

This application is called RemoteShe.

RemoteShe is a job discovery platform that helps people find remote jobs at companies with strong care infrastructure, including maternity leave, fertility support, childcare support, flexible work, and leadership diversity.

RemoteShe is part of the MomOps ecosystem and uses Carefolio metrics to evaluate workplace care infrastructure.

The application must connect to Supabase as the backend database.

Use Supabase tables and APIs for storing companies, jobs, and care signals.

APPLICATION PAGES (USE EXISTING UI)

Implement functionality for the following pages already designed in the UI.

Home
Job Search
Company Profile
About
Admin Dashboard

HOME PAGE FUNCTIONALITY

Use the existing hero and layout.

Connect the search bar to the jobs database.

Search should allow:

job title
company name
keywords

Below the hero show featured companies.

Each company card should pull data dynamically from Supabase.

Company cards display:

company logo
company name
remote policy
maternity leave weeks
fertility support indicator
childcare support indicator
Carefolio score

Clicking the company card opens the company profile page.

JOB SEARCH PAGE FUNCTIONALITY

Connect filters to the Supabase jobs and companies tables.

Filters should dynamically filter results.

Filters include:

remote type (global / region restricted)
maternity leave weeks
fertility or IVF coverage
childcare support
flexible return to work
women leadership percentage
industry
salary range

Job cards display:

job title
company name
location restrictions
remote type
salary range
Carefolio score
apply button linking to job URL

All results should update dynamically when filters change.

COMPANY PROFILE PAGE

Populate the page dynamically from Supabase.

Display company data:

company logo
website
industry
remote policy

Care infrastructure section shows:

maternity leave weeks
paternity leave weeks
fertility or IVF coverage
childcare support
caregiver leave
women leadership percentage
Carefolio score

Add verification label:

verified
self reported
AI extracted

Display all jobs for that company below the profile.

ABOUT PAGE

Static informational page explaining:

RemoteShe mission
What Carefolio means
How workplace care infrastructure impacts real working lives

Explain that RemoteShe surfaces workplace policies that affect caregiving, family life, and human wellbeing.

ADMIN DASHBOARD

Create a protected admin interface.

Admin pages:

Companies management
Jobs management
Perks management

Companies table should allow:

add company
edit company
delete company

Company form fields:

name
website
logo_url
industry
country
remote policy
maternity leave weeks
paternity leave weeks
fertility or IVF coverage
childcare support
caregiver leave
women leadership percentage
Carefolio score
verification status
last verified date

Jobs management page should allow:

add job
edit job
delete job

Job fields:

company
job title
department
location
remote type
salary range
job URL
source
posted date

Perks management page allows adding company benefits such as:

egg freezing
miscarriage leave
menopause support
childcare stipend
returnship programs

Each perk should link to the company ID.

SUPABASE DATABASE STRUCTURE

Create the following tables.

companies

id
name
website
logo_url
industry
country
remote_policy
maternity_leave_weeks
paternity_leave_weeks
ivf_coverage
fertility_support
childcare_support
caregiver_leave
women_leadership_percent
carefolio_score
verification_status
last_verified_date

jobs

id
company_id
title
department
location
remote_type
salary_range
job_url
source
posted_date

perks

id
company_id
perk_type
description
verified
source_url

TECHNICAL REQUIREMENTS

Connect all pages to Supabase APIs.

Use Supabase queries for:

search
filters
company profile loading
admin updates

Ensure the site is responsive for mobile, tablet, and desktop.

Ensure filters update results dynamically.