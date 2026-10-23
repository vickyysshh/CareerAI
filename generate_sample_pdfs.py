"""
generate_sample_pdfs.py — Generates realistic sample test resume PDFs for CareerIQ.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

OUT_DIR = os.path.join(os.path.dirname(__file__), "data", "sample_resumes_pdf")
os.makedirs(OUT_DIR, exist_ok=True)

RESUMES = [
    {
        "filename": "Resume_Aarav_Sharma_MLEngineer.pdf",
        "name": "Aarav Sharma",
        "title": "Machine Learning Engineer | MLOps Specialist",
        "contact": "aarav.sharma@email.com | +91 98765 43210 | Bengaluru, India | github.com/aarav-ml",
        "summary": "Results-oriented Machine Learning Engineer with 3+ years of experience designing, training, and deploying scalable deep learning and generative AI pipelines. Proficient in PyTorch, Docker, Kubernetes, and AWS cloud infrastructure with a focus on low-latency inference and MLOps automation.",
        "skills": "Python, SQL, PyTorch, TensorFlow, Docker, Kubernetes, AWS, MLflow, CI/CD, Git, Linux, REST APIs, FastAPI",
        "experience": [
            ("Senior ML Engineer — Apex AI Technologies, Bengaluru", "2023 – Present",
             "Architected and deployed distributed PyTorch training pipelines on AWS EC2 GPU clusters, reducing epoch training time by 35%. Implemented automated model tracking and registry using MLflow, containerizing models with Docker and orchestrating serving pods via Kubernetes (K8s)."),
            ("Machine Learning Engineer — Nexa Analytics, Pune", "2021 – 2023",
             "Developed computer vision and NLP classification models using scikit-learn and TensorFlow. Integrated high-throughput inference endpoints with FastAPI and established CI/CD automated deployment pipelines.")
        ],
        "education": "B.Tech in Computer Science & Engineering — National Institute of Technology (NIT), 2021"
    },
    {
        "filename": "Resume_Priya_Patel_DataScientist.pdf",
        "name": "Priya Patel",
        "title": "Data Scientist | GenAI & Applied ML",
        "contact": "priya.patel@email.com | +91 91234 56789 | Hyderabad, India | linkedin.com/in/priya-ds",
        "summary": "Analytical Data Scientist with 2.5 years of industry experience building statistical models, end-to-end predictive systems, and Retrieval-Augmented Generation (RAG) applications using LLMs and LangChain.",
        "skills": "Python, SQL, Pandas, NumPy, scikit-learn, Statistics, LLMs, RAG, LangChain, Hugging Face, Prompt Engineering, Vector Databases, A/B Testing",
        "experience": [
            ("Data Scientist — CloudScale Analytics, Hyderabad", "2022 – Present",
             "Built custom RAG enterprise knowledge-base search engine leveraging LangChain, Hugging Face transformer embeddings, and Pinecone vector databases. Formulated and tested statistical hypotheses via A/B testing frameworks, improving user engagement by 18%."),
            ("Associate Data Scientist — QuantData Labs, Mumbai", "2021 – 2022",
             "Engineered automated feature extraction pipelines using Pandas and NumPy. Trained random forest and gradient boosted classifiers using scikit-learn for churn forecasting.")
        ],
        "education": "M.Sc. in Data Science & Applied Statistics — University of Hyderabad, 2021"
    },
    {
        "filename": "Resume_Rohan_Verma_DataAnalyst.pdf",
        "name": "Rohan Verma",
        "title": "Business Intelligence & Data Analyst",
        "contact": "rohan.verma@email.com | +91 99887 76655 | Gurugram, Delhi NCR | tableaupublic.com/rohan-v",
        "summary": "Detail-driven Data Analyst with 2 years of experience turning complex datasets into actionable business intelligence dashboards and executive reports. Advanced proficiency in SQL queries, Power BI, Tableau, and Excel.",
        "skills": "SQL, Excel, Power BI, Tableau, Python, Data Visualization, Statistics, Business Analyst, A/B Testing",
        "experience": [
            ("Data Analyst — MetricWave Consulting, Gurugram", "2023 – Present",
             "Designed 15+ automated interactive KPI dashboards in Power BI and Tableau tracking revenue, conversion rates, and retention. Authored complex SQL queries on PostgreSQL data warehouses, speeding up report generation by 40%."),
            ("Junior BI Analyst — FinServe India, Delhi", "2022 – 2023",
             "Conducted descriptive statistical analysis using Advanced Excel (Power Query, VLOOKUP, Pivot Tables) and Python scripts for monthly financial audits.")
        ],
        "education": "B.Com (Honours) with Computer Applications — Delhi University, 2022"
    },
    {
        "filename": "Resume_Ananya_Iyer_FullStack.pdf",
        "name": "Ananya Iyer",
        "title": "Full Stack Developer | Python Backend & React",
        "contact": "ananya.iyer@email.com | +91 97654 32109 | Chennai, India | github.com/ananya-dev",
        "summary": "Full Stack Developer with 3 years of hands-on experience designing responsive user interfaces with React and robust, scalable backend APIs using Python (FastAPI, Django) and PostgreSQL.",
        "skills": "Python, JavaScript, TypeScript, React, Node.js, FastAPI, Django, PostgreSQL, Docker, Git, REST APIs, Linux",
        "experience": [
            ("Full Stack Developer — StackCraft Systems, Chennai", "2023 – Present",
             "Engineered responsive modern web interfaces with React, TypeScript, and Tailwind CSS. Built asynchronous RESTful APIs using FastAPI and PostgreSQL, containerizing full-stack microservices with Docker."),
            ("Backend Developer — WebForge Solutions, Bengaluru", "2021 – 2023",
             "Developed core backend modules using Django and Node.js. Maintained code versioning with Git and automated test suites on Linux staging servers.")
        ],
        "education": "B.E. in Information Technology — Anna University, Chennai, 2021"
    }
]

def create_resume_pdf(data, filepath):
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e1b4b')
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#6366f1')
    )
    contact_style = ParagraphStyle(
        'Contact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#4b5563')
    )
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#312e81')
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1f2937')
    )
    skills_style = ParagraphStyle(
        'Skills',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#0f172a')
    )

    story = []
    
    # Header
    story.append(Paragraph(data["name"], title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(data["title"], subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(data["contact"], contact_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6366f1'), spaceAfter=10))

    # Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(data["summary"], body_style))
    story.append(Spacer(1, 10))

    # Skills
    story.append(Paragraph("TECHNICAL COMPETENCIES", heading_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(data["skills"], skills_style))
    story.append(Spacer(1, 10))

    # Experience
    story.append(Paragraph("PROFESSIONAL EXPERIENCE", heading_style))
    story.append(Spacer(1, 4))
    for role_company, period, details in data["experience"]:
        story.append(Paragraph(f"<b>{role_company}</b> &nbsp;|&nbsp; <i>{period}</i>", body_style))
        story.append(Spacer(1, 2))
        story.append(Paragraph(details, body_style))
        story.append(Spacer(1, 6))
    story.append(Spacer(1, 4))

    # Education
    story.append(Paragraph("EDUCATION", heading_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(data["education"], body_style))

    doc.build(story)
    print(f"Generated: {filepath}")

def main():
    print(f"Generating {len(RESUMES)} sample resume PDFs in {OUT_DIR}...")
    for item in RESUMES:
        out_path = os.path.join(OUT_DIR, item["filename"])
        create_resume_pdf(item, out_path)
    print("Done!")

if __name__ == "__main__":
    main()
