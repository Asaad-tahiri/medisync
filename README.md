# 🩺 MediSync — Plateforme de gestion médicale

## 📌 Vue d’ensemble

**MediSync** est une application **full-stack** de gestion de cabinet médical permettant la gestion des :

* rendez-vous médicaux
* dossiers patients
* prescriptions
* facturation
* statistiques administratives

L’application repose sur une architecture moderne avec :

* un **backend REST API** en **Node.js / Express / MongoDB**
* un **frontend Angular 21**
* une gestion sécurisée des utilisateurs avec **JWT**

---

# 🏗️ Architecture du projet

```bash
MediSync/
│
├── backend/    # API REST Node.js + Express + MongoDB
└── frontend/   # Application Angular 21
```

---

# ⚙️ Backend — `/backend`

## 🛠️ Stack technique

* Node.js
* Express 5.2
* MongoDB / Mongoose 9.6
* JWT Authentication
* bcryptjs
* Multer

---

# 🗄️ Modèles de données

## 👤 User

Gestion des utilisateurs avec 4 rôles :

* patient
* doctor
* secretary
* admin

### Champs spécifiques

#### Médecin

* spécialité
* tarif
* secteur
* langues
* ville
* note moyenne

#### Patient

* allergies
* antécédents médicaux

---

## 📅 Appointment

Gestion des rendez-vous :

* relation patient ↔ médecin
* durée : 15 / 30 / 60 min
* motif :

  * consultation
  * suivi
  * urgence
  * bilan
* statut :

  * scheduled
  * completed
  * cancelled
  * no-show

---

## 🩺 MedicalRecord

Compte-rendu médical contenant :

* symptômes
* diagnostic
* traitement
* notes

---

## 💊 Prescription

Ordonnances médicales avec :

* nom médicament
* dosage
* fréquence
* durée

---

## 💰 Invoice

Factures médicales :

* lignes d’articles
* statut payé / impayé

---

## 🔔 Notification

Notifications utilisateurs :

* rappel de rendez-vous
* système
* feedback
* notifications médicales

Avec gestion :

* lu / non lu

---

## ⭐ Feedback

Avis des patients sur les médecins :

* note (1 → 5)
* commentaire

➡️ Mise à jour automatique de la note moyenne du médecin.

---

## 📁 Document

Upload de documents patients via **Multer** :

```bash
/uploads
```

---

## 🏥 ClinicSettings

Paramètres globaux du cabinet :

* nom
* adresse
* horaires d’ouverture par jour

---

# 🔌 API REST — `/api`

# 🔐 Auth

```http
POST /auth/register
POST /auth/login
GET  /auth/me
PUT  /auth/profile
```

---

# 👨‍⚕️ Médecins & Patients

```http
GET /doctors
```

### Filtres disponibles

* spécialité
* ville
* langue

```http
GET /patients/:id
```

---

# 📅 Appointments

## CRUD complet

```http
GET    /appointments
POST   /appointments
PUT    /appointments/:id
DELETE /appointments/:id
```

## Actions supplémentaires

```http
PATCH /appointments/:id/cancel
```

## Créneaux disponibles

```http
GET /doctors/:id/available-slots
```

### Fonctionnalités

* créneaux 9h → 17h
* intervalles de 30 min
* détection des conflits

## Feedback

```http
POST /appointments/:id/feedback
GET  /doctors/:id/feedbacks
```

---

# 🩺 Medical Records

```http
GET  /patients/:id/records
POST /patients/:id/records
```

```http
GET  /patients/:id/prescriptions
POST /patients/:id/prescriptions
```

```http
GET  /patients/:id/documents
POST /patients/:id/documents
```

```http
GET  /patients/:id/invoices
POST /patients/:id/invoices
```

---

# 🛡️ Admin

## Gestion utilisateurs

CRUD complet :

* médecins
* secrétaires

## Statistiques

```http
GET /admin/stats
```

### Statistiques calculées

* revenu journalier
* taux de no-show
* rendez-vous par médecin

➡️ Utilisation de pipelines d’agrégation MongoDB.

## Paramètres du cabinet

```http
GET /admin/clinic
PUT /admin/clinic
```

---

# 🔔 Notifications

```http
GET   /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all
```

---

# 🔒 Sécurité & Middleware

## `verifyToken`

Validation du JWT depuis :

```http
Authorization: Bearer <token>
```

---

## `checkRole(...roles)`

Contrôle d’accès par rôle :

* 401 Unauthorized
* 403 Forbidden

---

## 🔑 Sécurité mot de passe

Contraintes :

* minimum 8 caractères
* 1 majuscule
* 1 chiffre
* 1 caractère spécial

➡️ Hashage avec **bcryptjs**

---

# 🎨 Frontend — `/frontend`

## 🛠️ Stack technique

* Angular 21
* TypeScript 5.9
* RxJS 7.8
* Chart.js / ng2-charts
* jsPDF

---

# 🧭 Routing & Guards

| Route             | Composant               | Accès                        |
| ----------------- | ----------------------- | ---------------------------- |
| `/login`          | LoginComponent          | Public                       |
| `/register`       | RegisterComponent       | Public                       |
| `/dashboard`      | DashboardComponent      | Connecté                     |
| `/appointment`    | AppointmentComponent    | Patient / Secrétaire         |
| `/medical-record` | MedicalRecordComponent  | Patient / Médecin            |
| `/doctor`         | DoctorComponent         | Médecin                      |
| `/doctor/profile` | DoctorProfileComponent  | Médecin                      |
| `/patient/:id`    | PatientProfileComponent | Médecin / Secrétaire / Admin |
| `/admin`          | AdminComponent          | Admin                        |

---

## 🛡️ Guards & Interceptors

### AuthGuard

➡️ Redirection vers `/login` si aucun token.

### RoleGuard

➡️ Vérification du rôle via `localStorage`.

### AuthInterceptor

* injection automatique du token
* gestion des erreurs 401
* déconnexion automatique

---

# 📄 Pages implémentées

## 🔐 Login / Register

* formulaires validés
* redirection selon rôle
* affichage des erreurs

---

## 🏠 Dashboard

Accueil dynamique avec cartes adaptées selon le rôle utilisateur.

---

## 📅 AppointmentComponent

Fonctionnalités :

* création de rendez-vous
* sélection médecin
* date & durée
* motif de consultation
* liste des rendez-vous
* affichage des statuts

---

## 👨‍⚕️ DoctorComponent

Workflow médical :

```text
En attente → En cours → Terminé
```

Fonctionnalités :

* consultations du jour
* saisie compte-rendu
* génération ordonnance
* accès dossier patient

---

## 👨‍⚕️ DoctorProfileComponent

Gestion du profil professionnel :

* spécialité
* ville
* langues
* tarif
* secteur

- affichage :

* note moyenne
* avis patients

---

## 👤 PatientProfileComponent

Dossier patient complet :

* informations personnelles
* allergies
* antécédents
* historique médical
* ordonnances

---

## 📑 MedicalRecordComponent

Fonctionnalités :

* consultation dossier médical
* export PDF avec jsPDF

---

## 📊 AdminComponent

KPIs disponibles :

* patients actifs
* rendez-vous semaine
* revenu mensuel
* taux de no-show

### Graphiques Chart.js

* revenu mensuel (bar chart)
* spécialités (pie chart)
* occupation salles (line chart)

---

# 🔧 Services Angular

| Service                | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `AuthService`          | login/logout/register, `currentUser$`, stockage `localStorage` |
| `AppointmentService`   | CRUD rendez-vous, récupération médecins                        |
| `DoctorService`        | gestion profil médecin, récupération patients                  |
| `MedicalRecordService` | dossiers médicaux, prescriptions                               |

---

# 🚀 Fonctionnalités principales

✅ Authentification JWT
✅ Gestion multi-rôles
✅ Gestion complète des rendez-vous
✅ Dossiers médicaux
✅ Ordonnances
✅ Upload de documents
✅ Dashboard administrateur
✅ Statistiques & graphiques
✅ Export PDF
✅ Notifications temps réel
✅ Contrôle d’accès sécurisé

---

# 📈 Perspectives d’amélioration

* Notifications email/SMS
* Paiement en ligne
* Visioconsultation
* Calendrier synchronisé Google Calendar
* Chat temps réel médecin/patient
* Dockerisation
* CI/CD
* Tests unitaires & e2e

---

# 👨‍💻 Auteur

Projet développé dans le cadre d’une plateforme moderne de gestion médicale full-stack.
