<p align="centr">
<img src="https://images.squarespace-cdn.com/content/5cc0e57236f8e70001651ea6/1599789508819-NGZXYWJDQRCULLU94QEJ/hikma-hb.png?format=300w&content-type=image/png" alt="Hikma Health" />
</p>

> [!WARNING]
> **⚠️ DEPRECATED - THIS REPOSITORY IS NO LONGER MAINTAINED ⚠️**
>
> This repository has been superseded by our new server implementation. Please migrate to:
>
> **New Repository: https://github.com/hikmahealth/hikma-health-server**
>
> The new repository offers:
> - Cheaper infrastructure costs
> - Simpler architecture and maintenance
> - Improved performance and scalability
> - Active development and support
> - Combined backend and portal functionality (JavaScript/TypeScript only, no more Python)
> - New permissions and roles management
> - New pharmacy & Inventory management system
>
> **Migration is simple and straightforward.** Please begin your migration process as soon as possible.
>
> No new features or bug fixes will be applied to this repository.
>
> For more help, please email our CTO at ally[at]hikmahealth.com



<br><br><br><br><br>

# Hikma Health Admin Application

The Hikma Health platform is a mobile electronic health record system designed for organizations working in low-resource settings to collect and access patient health information.
The repository contains the admin web application which is a portal for management of the clinic, its users and patients. Additional functionality can also be added easily.

The platform is designed to be intuitive and allow for efficient patient workflows for patient registration, data entry, and data download. You can see a user demo here: https://drive.google.com/file/d/1ssBdEPShWCu3ZXNCXnoodbwWgqlTncJb/view?usp=drive_link

This repository contains the client-side code for Hikma Health's administrators application. The corresponding server-side code is located at https://github.com/hikmahealth/hikma-health-backend. Please feel free to file feature requests and bugs at either location.

The admin app is a web only application.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/hikmahealth/hikma-health-admin/tree/main)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhikmahealth%2Fhikma-health-admin&env=NEXT_PUBLIC_HIKMA_API&project-name=hikma-health-admin)

## Get started locally

Clone the project

```bash
  git clone git@github.com:hikmahealth/hikma-health-admin.git
```

Go to the project directory

```bash
  cd hikma-health-admin
```

Install dependencies

```bash
  npm install
```

Start the frontend

```bash
  npm run dev
```

This will be available on your browser: localhost:3000/

To connect to your backend, either locally hosted or remotely hosted, make sure the backend and database are running. See documentation on server set up here: https://github.com/hikmahealth/hikma-health-backend.

See below for how to tell your frontend where to find your bakend.

## Environment Variables

To run this project, you will need to add the following environment variable to your .env file

`NEXT_PUBLIC_HIKMA_API`

This variable holds a link to the backend (server) which connects to the database.This file is by default already ignored in the `.gitignore` file, make sure it remains there.

🔥 DO NOT COMMIT THIS INFORMATION TO YOUR VERSION CONTROL (GITHUB) OR SHARE IT WITH UNAUTHORIZED PERSONEL 🔥

## Technology Stack

- **React (v18.2):** Leading UI library for modern UIs
- **NextJS (v13.2):** Performant react metaframework with routing and SSR
- **Axios (v1.3):** HTTP library for easy requests to server
- **Twind (v0.16):** Tailwind compile library to add minimal styles
- **Mantine (v6):** UI Component library
- **Typescript (v4.8):** Adding type support to JavaScript

## Features

- Custom form creation through a visual form builder
- Premade template forms with one-click install
- Clinician / User registration and management
- Export patient information (data dump as a spreadsheet)
- Patient information view
- Light/dark mode support

## Screenshots

<div style="display: flex">
  <img src="https://drive.google.com/uc?export=view&id=1FcUQJgEYyVED6utDWwO5bgIaesJMU0Kz" style="width: 400px; height:auto;" alt="Hikma Health" />
  <img src="https://drive.google.com/uc?export=view&id=1LopQbc7u61RewaA5iGnxOh-wQ4Ik2os1" style="width: 400px; height:auto;" alt="Hikma Health" />
  <img src="https://drive.google.com/uc?export=view&id=1pye4X3bQujkrDlc2cwr3XzWNZ6IDVix8" style="width: 400px; height:auto" alt="Hikma Health" />
</div>

## Roadmap

Features on the roadmap represent the vision for the admin portal over the coming versions, but none are guaranteed. If there is a feature you would love to see supported, open a feature-request / issue with more details and we can prioritize features with the most requests.

- [ ] Improve data caching - maybe react-query / rtk-query??
- [ ] Improve test coverage
- [ ] Add support for patient workflows through the admin portal
- [ ] Add support for single patient report download
- [ ] Refactor form builder code with cleaner types and stable drag and drop
- [ ] Support patient search
- [ ] Support pagination in patient view
- [ ] Improve documentation
- [ ] Improve deployment button documentation

## Contributing

Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

## License

[MIT](https://choosealicense.com/licenses/mit/)
