# CurlyBraces {}
> An Interactive Java Static Code Analysis & Developer Growth Platform

![Java 21](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green?style=for-the-badge&logo=springboot)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql)

CurlyBraces is an automated static code analysis tool that serves as an intelligent code reviewer and developer growth tracker. It parses Java source code into Abstract Syntax Trees (AST) to derive architectural insights, analyze complexity metrics, and offer automated refactoring suggestions.

---

## Key Features

* **AST Parsing & Complexity Analysis:** Calculates Cyclomatic Complexity and estimates time complexity via deep loop inspection using `JavaParser`.
* **Automated Refactoring Guidance:** Identifies code smells and provides actionable structural recommendations.
* **Session-Based Authentication:** Secure user authentication supporting individual submission histories.
* **Developer Progress Dashboard:** Visualizes code quality progression and historical performance via Chart.js.
* **Interactive API Documentation:** Complete RESTful endpoint coverage using OpenAPI / Swagger UI.

---

## Tech Stack

* **Backend:** Java 21, Spring Boot, Spring Data JPA, JavaParser
* **Database:** MySQL
* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js
* **API Specs:** Swagger UI / OpenAPI
* **Build Tool:** Maven

---

## Quick Start

### API Key
* Generate an API and paste it wherever mentioned

### Prerequisites
* JDK 21
* Maven 3.8+
* MySQL 8.0+

### Database Setup
Create a MySQL database:
```sql
CREATE DATABASE curlybraces_db;
