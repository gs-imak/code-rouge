"""Build the M1 handoff / validation PDF for Nathanael (Code Rouge).

Outputs: docs/m1-handoff-validation.pdf

Run:
    python tools/scripts/build-m1-handoff.py

Regenerate after the validation visio with the sign-off blocks filled in
by editing the SIGN_OFF section below.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


# ---- palette ----------------------------------------------------------------

PRIMARY = colors.HexColor("#1a1f2e")
ACCENT = colors.HexColor("#c8102e")
TEXT = colors.HexColor("#2c3338")
MUTED = colors.HexColor("#6c757d")
SUBTLE = colors.HexColor("#f5f5f7")
BORDER = colors.HexColor("#d1d5db")

STATUS = {
    "done": colors.HexColor("#1a7f37"),
    "wip": colors.HexColor("#cf7a01"),
    "blocked": colors.HexColor("#c8102e"),
    "scope": colors.HexColor("#6c757d"),
}


# ---- styles ---------------------------------------------------------------

styles = getSampleStyleSheet()

styles.add(
    ParagraphStyle(
        name="CoverEyebrow",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=ACCENT,
        spaceAfter=6,
        leading=14,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=34,
        textColor=PRIMARY,
        leading=40,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=14,
        textColor=TEXT,
        leading=20,
        spaceAfter=20,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=MUTED,
        leading=14,
    )
)
styles.add(
    ParagraphStyle(
        name="H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=PRIMARY,
        leading=22,
        spaceBefore=18,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=PRIMARY,
        leading=16,
        spaceBefore=14,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=TEXT,
        leading=15,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="BodySmall",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=TEXT,
        leading=13,
    )
)
styles.add(
    ParagraphStyle(
        name="Caption",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        textColor=MUTED,
        leading=12,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="Pill",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=colors.white,
        leading=10,
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=colors.white,
        leading=12,
    )
)
styles.add(
    ParagraphStyle(
        name="TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=TEXT,
        leading=13,
    )
)
styles.add(
    ParagraphStyle(
        name="TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=PRIMARY,
        leading=13,
    )
)
styles.add(
    ParagraphStyle(
        name="Mono",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8.5,
        textColor=TEXT,
        leading=12,
    )
)
styles.add(
    ParagraphStyle(
        name="SignLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=PRIMARY,
        leading=12,
        spaceAfter=4,
    )
)


def status_pill(label: str, kind: str) -> Table:
    """Render a small colored pill for status cells."""
    color = STATUS.get(kind, MUTED)
    text = Paragraph(label, styles["Pill"])
    t = Table([[text]], colWidths=[2.5 * cm], rowHeights=[0.55 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("ROUNDEDCORNERS", [4, 4, 4, 4]),
            ]
        )
    )
    return t


# ---- page templates --------------------------------------------------------

PAGE_W, PAGE_H = A4
MARGIN_X = 2 * cm
MARGIN_TOP = 1.8 * cm
MARGIN_BOTTOM = 1.8 * cm


def cover_decoration(canvas, doc):
    canvas.saveState()
    # Top accent bar
    canvas.setFillColor(ACCENT)
    canvas.rect(0, PAGE_H - 0.4 * cm, PAGE_W, 0.4 * cm, stroke=0, fill=1)
    # Bottom thin rule
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, 1.4 * cm, PAGE_W - MARGIN_X, 1.4 * cm)
    # Footer text
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 1.0 * cm, "Code Rouge — Document de validation M1 — Confidentiel")
    canvas.drawRightString(PAGE_W - MARGIN_X, 1.0 * cm, "v1.0  —  6 mai 2026")
    canvas.restoreState()


def content_decoration(canvas, doc):
    canvas.saveState()
    # Header rule
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, PAGE_H - 1.4 * cm, PAGE_W - MARGIN_X, PAGE_H - 1.4 * cm)
    # Header text
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.setFillColor(PRIMARY)
    canvas.drawString(MARGIN_X, PAGE_H - 1.1 * cm, "CODE ROUGE  /  VALIDATION M1")
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 1.1 * cm, "Socle technique")
    # Footer rule + page number
    canvas.setStrokeColor(BORDER)
    canvas.line(MARGIN_X, 1.4 * cm, PAGE_W - MARGIN_X, 1.4 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 1.0 * cm, "v1.0  —  6 mai 2026  —  Confidentiel")
    canvas.drawRightString(PAGE_W - MARGIN_X, 1.0 * cm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    out_path = Path(__file__).resolve().parents[2] / "docs" / "m1-handoff-validation.pdf"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    doc = BaseDocTemplate(
        str(out_path),
        pagesize=A4,
        title="Code Rouge — Validation M1",
        author="Georges (SMK Studios) pour The Game",
        subject="Document de handoff et de validation du jalon M1",
        creator="reportlab",
    )

    # Cover frame
    cover_frame = Frame(
        MARGIN_X,
        MARGIN_BOTTOM,
        PAGE_W - 2 * MARGIN_X,
        PAGE_H - MARGIN_TOP - MARGIN_BOTTOM,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="cover",
    )
    # Content frame
    content_frame = Frame(
        MARGIN_X,
        MARGIN_BOTTOM,
        PAGE_W - 2 * MARGIN_X,
        PAGE_H - MARGIN_TOP - MARGIN_BOTTOM - 0.6 * cm,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="content",
    )
    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=cover_decoration),
            PageTemplate(id="content", frames=[content_frame], onPage=content_decoration),
        ]
    )

    story: list = []

    # ---- COVER ------------------------------------------------------------

    story.append(Spacer(1, 7 * cm))
    story.append(Paragraph("VALIDATION DE JALON", styles["CoverEyebrow"]))
    story.append(Paragraph("M1 &mdash; Socle technique", styles["CoverTitle"]))
    story.append(
        Paragraph(
            "Document de handoff pour la validation client.<br/>"
            "Atelier de revue : <b>jeudi 7 mai 2026, 15h00</b> (visio).",
            styles["CoverSubtitle"],
        )
    )

    story.append(Spacer(1, 5 * cm))

    cover_meta = Table(
        [
            [Paragraph("<b>Projet</b>", styles["CoverMeta"]), Paragraph("Code Rouge", styles["CoverMeta"])],
            [Paragraph("<b>Client</b>", styles["CoverMeta"]), Paragraph("Nathana&euml;l Masson &mdash; The Game", styles["CoverMeta"])],
            [Paragraph("<b>Prestataire</b>", styles["CoverMeta"]), Paragraph("Georges (SMK Studios)", styles["CoverMeta"])],
            [Paragraph("<b>P&eacute;riode du jalon</b>", styles["CoverMeta"]), Paragraph("28 avril &mdash; 7 mai 2026", styles["CoverMeta"])],
            [Paragraph("<b>Montant jalon</b>", styles["CoverMeta"]), Paragraph("4 200 &euro; HT &mdash; facturable apr&egrave;s validation", styles["CoverMeta"])],
            [Paragraph("<b>Date du document</b>", styles["CoverMeta"]), Paragraph("6 mai 2026 &mdash; v1.0", styles["CoverMeta"])],
        ],
        colWidths=[4 * cm, 12 * cm],
        hAlign="LEFT",
    )
    cover_meta.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -2), 0.25, BORDER),
            ]
        )
    )
    story.append(cover_meta)

    story.append(PageBreak())
    # All subsequent pages use the content template
    story.append(SwitchTemplate("content"))

    # ---- 1. SYNTHESE EXECUTIVE -------------------------------------------

    story.append(Paragraph("1. Synth&egrave;se ex&eacute;cutive", styles["H1"]))
    story.append(
        Paragraph(
            "Le jalon M1 (&laquo; Socle technique &raquo;) couvre la mise en place du monorepo, "
            "de la cha&icirc;ne d'int&eacute;gration continue, du serveur local NUC, du mode kiosque sur "
            "les trois applications joueurs, et de la persistance &agrave; la reprise apr&egrave;s "
            "force-stop. <b>L'ensemble des crit&egrave;res d'acceptation est rempli</b>, "
            "avec en sus 14 corrections issues d'une revue r&eacute;trospective post-jalon "
            "(s&eacute;curit&eacute;, performance, architecture).",
            styles["Body"],
        )
    )

    # KPI grid
    kpi_data = [
        [
            Paragraph("<b>5 / 5</b>", styles["TableCellBold"]),
            Paragraph("<b>106</b>", styles["TableCellBold"]),
            Paragraph("<b>5 / 5</b>", styles["TableCellBold"]),
            Paragraph("<b>14</b>", styles["TableCellBold"]),
        ],
        [
            Paragraph("Chantiers M1<br/>termin&eacute;s", styles["BodySmall"]),
            Paragraph("Tests automatis&eacute;s<br/>passants", styles["BodySmall"]),
            Paragraph("Jobs CI verts<br/>(Lint, TS, Test, APK, EXE)", styles["BodySmall"]),
            Paragraph("Corrections retro<br/>livr&eacute;es post-M1", styles["BodySmall"]),
        ],
    ]
    kpi_table = Table(kpi_data, colWidths=[4 * cm] * 4, rowHeights=[1.2 * cm, 1.2 * cm])
    kpi_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SUBTLE),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, 0), 18),
                ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(Spacer(1, 6))
    story.append(kpi_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Statut global", styles["H2"]))
    status_grid = Table(
        [
            [
                Paragraph("<b>P&eacute;rim&egrave;tre M1</b>", styles["TableCell"]),
                status_pill("LIVR&Eacute;", "done"),
                Paragraph("100&nbsp;% des crit&egrave;res d'acceptation valid&eacute;s en local", styles["TableCell"]),
            ],
            [
                Paragraph("<b>Qualit&eacute; / s&eacute;curit&eacute;</b>", styles["TableCell"]),
                status_pill("LIVR&Eacute;", "done"),
                Paragraph("Revue 4 agents (code, refactor, perf, s&eacute;cu) pass&eacute;e ; 14 corrections int&eacute;gr&eacute;es", styles["TableCell"]),
            ],
            [
                Paragraph("<b>Int&eacute;gration visuelle</b>", styles["TableCell"]),
                status_pill("HORS M1", "scope"),
                Paragraph("Plac&eacute;e en M2 par construction. D&eacute;pend de la validation des maquettes par le client", styles["TableCell"]),
            ],
            [
                Paragraph("<b>D&eacute;ploiement NUC physique</b>", styles["TableCell"]),
                status_pill("HORS M1", "scope"),
                Paragraph("Mat&eacute;riel non d&eacute;ploy&eacute;. Script d'installation valid&eacute; en dry-run", styles["TableCell"]),
            ],
            [
                Paragraph("<b>Tag de version v0.1.0</b>", styles["TableCell"]),
                status_pill("EN ATTENTE", "wip"),
                Paragraph("Pos&eacute; apr&egrave;s validation client durant l'atelier de revue du 7 mai", styles["TableCell"]),
            ],
        ],
        colWidths=[4.5 * cm, 3 * cm, 9.5 * cm],
        hAlign="LEFT",
    )
    status_grid.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
                ("LINEABOVE", (0, 0), (-1, 0), 0.5, BORDER),
            ]
        )
    )
    story.append(status_grid)

    story.append(PageBreak())

    # ---- 2. PERIMETRE ATTENDU --------------------------------------------

    story.append(Paragraph("2. P&eacute;rim&egrave;tre attendu (rappel CDC)", styles["H1"]))
    story.append(
        Paragraph(
            "Le jalon M1 a &eacute;t&eacute; cadr&eacute; en cinq chantiers, &eacute;tal&eacute;s sur "
            "cinq jours ouvr&eacute;s (J1 &agrave; J5). Chaque chantier porte ses propres crit&egrave;res "
            "d'acceptation, formalis&eacute;s en interne dans <i>docs/m1-plan.md</i>.",
            styles["Body"],
        )
    )

    chantier_table_data = [
        [
            Paragraph("<b>Chantier</b>", styles["TableHeader"]),
            Paragraph("<b>Jour</b>", styles["TableHeader"]),
            Paragraph("<b>Objectif</b>", styles["TableHeader"]),
        ],
        [
            Paragraph("01 &mdash; Monorepo & design-system", styles["TableCellBold"]),
            Paragraph("J1 mar. 28 avr.", styles["TableCell"]),
            Paragraph("Workspace pnpm + Turborepo, configs racines, packages stub.", styles["TableCell"]),
        ],
        [
            Paragraph("02 &mdash; Pipeline d'int&eacute;gration continue", styles["TableCellBold"]),
            Paragraph("J2 mer. 29 avr.", styles["TableCell"]),
            Paragraph("GitHub Actions : lint, typecheck, test, build APK, build EXE.", styles["TableCell"]),
        ],
        [
            Paragraph("03 &mdash; Serveur local NUC", styles["TableCellBold"]),
            Paragraph("J3 jeu. 30 avr.", styles["TableCell"]),
            Paragraph("Node.js + WebSocket + SQLite + script d'installation.", styles["TableCell"]),
        ],
        [
            Paragraph("04 &mdash; Mode kiosque", styles["TableCellBold"]),
            Paragraph("J4 ven. 1 mai", styles["TableCell"]),
            Paragraph("Screen Pinning Android + verrouillage Electron Windows.", styles["TableCell"]),
        ],
        [
            Paragraph("05 &mdash; Persistance & reprise", styles["TableCellBold"]),
            Paragraph("J5 lun. 4 mai", styles["TableCell"]),
            Paragraph("Reprise automatique sur force-stop, c&ocirc;t&eacute; client et serveur.", styles["TableCell"]),
        ],
    ]
    chantier_table = Table(
        chantier_table_data, colWidths=[6.5 * cm, 3 * cm, 7.5 * cm], hAlign="LEFT"
    )
    chantier_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(chantier_table)

    story.append(Spacer(1, 16))

    # ---- 3. LIVRABLES & ACCEPTANCE CRITERIA ------------------------------

    story.append(Paragraph("3. Livrables &mdash; statut crit&egrave;re par crit&egrave;re", styles["H1"]))
    story.append(
        Paragraph(
            "Tableau exhaustif des crit&egrave;res d'acceptation officiels et de leur "
            "v&eacute;rification empirique. Tous les statuts marqu&eacute;s <b>LIVR&Eacute;</b> "
            "ont &eacute;t&eacute; valid&eacute;s en local (commande pass&eacute;e, r&eacute;sultat observ&eacute;).",
            styles["Body"],
        )
    )

    ac_rows = [
        [
            Paragraph("<b>Chantier</b>", styles["TableHeader"]),
            Paragraph("<b>Crit&egrave;re d'acceptation</b>", styles["TableHeader"]),
            Paragraph("<b>Statut</b>", styles["TableHeader"]),
        ],
        # Chantier 01
        [
            Paragraph("01.1", styles["TableCellBold"]),
            Paragraph("<code>pnpm install</code> r&eacute;ussit avec workspaces vides", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("01.2", styles["TableCellBold"]),
            Paragraph("<code>tsc --noEmit</code> 0 erreur sur la base TypeScript stricte", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("01.3", styles["TableCellBold"]),
            Paragraph("7 membres workspace + <code>pnpm -r exec tsc --noEmit</code> 0 erreur", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("01.4", styles["TableCellBold"]),
            Paragraph("Clone neuf + install + typecheck fonctionnel sur GitHub", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        # Chantier 02
        [
            Paragraph("02.1", styles["TableCellBold"]),
            Paragraph("CI verte sur push <code>main</code> ; cache hit observ&eacute; au 2&deg; run", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("02.2", styles["TableCellBold"]),
            Paragraph("Badge CI vert dans le README de la branche par d&eacute;faut", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("02.3", styles["TableCellBold"]),
            Paragraph("Vitest racine, <code>pnpm test</code> passant en local et CI", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        # Chantier 03
        [
            Paragraph("03.1", styles["TableCellBold"]),
            Paragraph("Serveur up sur :8080, <code>/health</code> 200, WS handshake OK", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("03.2", styles["TableCellBold"]),
            Paragraph("Sch&eacute;mas Zod messages WS + tests unitaires (hello, malform&eacute;, inconnu)", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("03.3", styles["TableCellBold"]),
            Paragraph("Persistance SQLite : upsert <code>team_state</code>, survit au redemarrage", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("03.4", styles["TableCellBold"]),
            Paragraph("<code>install-nuc.sh</code> shellcheck-clean + dry-run jusqu'&agrave; systemd-enable", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        # Chantier 04
        [
            Paragraph("04.1", styles["TableCellBold"]),
            Paragraph("Apps RN (tablette, smartphone) build et installables (APK)", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("04.2", styles["TableCellBold"]),
            Paragraph("Screen Pinning Android : Home / Recents / Back / swipe / shade tous bloqu&eacute;s", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("04.3", styles["TableCellBold"]),
            Paragraph("Assaut s'ouvre fullscreen, sans frame ni menu, sans option de fermeture", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("04.4", styles["TableCellBold"]),
            Paragraph("Alt+Tab, Alt+F4, Ctrl+Esc, Super+L, Super+D, Ctrl+Shift+Esc no-op", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        # Chantier 05
        [
            Paragraph("05.1", styles["TableCellBold"]),
            Paragraph("Apps RN : reprise apr&egrave;s <code>am force-stop</code>, sans flash &eacute;cran de s&eacute;lection", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("05.2", styles["TableCellBold"]),
            Paragraph("Assaut : reprise apr&egrave;s force-kill, code de saisie pr&eacute;serv&eacute;", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("05.3", styles["TableCellBold"]),
            Paragraph("Reprise serveur : <code>HelloMessage</code> &rarr; <code>RestoreMessage</code> avec dernier &eacute;tat connu", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
        [
            Paragraph("05.4", styles["TableCellBold"]),
            Paragraph("Script de d&eacute;mo persistance op&eacute;rationnel + captures d'&eacute;cran", styles["TableCell"]),
            status_pill("LIVR&Eacute;", "done"),
        ],
    ]
    ac_table = Table(ac_rows, colWidths=[1.8 * cm, 12.2 * cm, 3 * cm], hAlign="LEFT", repeatRows=1)
    ac_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(ac_table)

    story.append(PageBreak())

    # ---- 4. INDICATEURS QUALITE -----------------------------------------

    story.append(Paragraph("4. Indicateurs qualit&eacute;", styles["H1"]))
    story.append(
        Paragraph(
            "M&eacute;triques mesur&eacute;es sur le commit de validation (<code>main</code> &agrave; "
            "la cl&ocirc;ture du jalon, post-int&eacute;gration des 14 corrections r&eacute;trospectives).",
            styles["Body"],
        )
    )

    qa_rows = [
        [
            Paragraph("<b>Indicateur</b>", styles["TableHeader"]),
            Paragraph("<b>Valeur</b>", styles["TableHeader"]),
            Paragraph("<b>Cible</b>", styles["TableHeader"]),
            Paragraph("<b>Statut</b>", styles["TableHeader"]),
        ],
        [
            Paragraph("Tests automatis&eacute;s passants", styles["TableCell"]),
            Paragraph("<b>106&nbsp;/&nbsp;106</b>", styles["TableCellBold"]),
            Paragraph("100&nbsp;%", styles["TableCell"]),
            status_pill("OK", "done"),
        ],
        [
            Paragraph("Jobs CI verts sur <code>main</code>", styles["TableCell"]),
            Paragraph("<b>5&nbsp;/&nbsp;5</b>", styles["TableCellBold"]),
            Paragraph("5&nbsp;/&nbsp;5", styles["TableCell"]),
            status_pill("OK", "done"),
        ],
        [
            Paragraph("Erreurs typecheck (mode strict)", styles["TableCell"]),
            Paragraph("<b>0</b>", styles["TableCellBold"]),
            Paragraph("0", styles["TableCell"]),
            status_pill("OK", "done"),
        ],
        [
            Paragraph("Warnings ESLint (max-warnings 0)", styles["TableCell"]),
            Paragraph("<b>0</b>", styles["TableCellBold"]),
            Paragraph("0", styles["TableCell"]),
            status_pill("OK", "done"),
        ],
        [
            Paragraph("Issues s&eacute;curit&eacute; bloquantes (revue OWASP)", styles["TableCell"]),
            Paragraph("<b>0</b>", styles["TableCellBold"]),
            Paragraph("0", styles["TableCell"]),
            status_pill("OK", "done"),
        ],
        [
            Paragraph("Vuln&eacute;rabilit&eacute;s d&eacute;pendances (Dependabot)", styles["TableCell"]),
            Paragraph("<b>0 critique</b>", styles["TableCellBold"]),
            Paragraph("0 critique / haute", styles["TableCell"]),
            status_pill("OK", "done"),
        ],
        [
            Paragraph("Couverture des chantiers M1", styles["TableCell"]),
            Paragraph("<b>5&nbsp;/&nbsp;5</b>", styles["TableCellBold"]),
            Paragraph("5&nbsp;/&nbsp;5", styles["TableCell"]),
            status_pill("OK", "done"),
        ],
    ]
    qa_table = Table(qa_rows, colWidths=[7 * cm, 3 * cm, 4 * cm, 3 * cm], hAlign="LEFT", repeatRows=1)
    qa_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(qa_table)

    story.append(Spacer(1, 14))

    story.append(Paragraph("Revue r&eacute;trospective post-jalon", styles["H2"]))
    story.append(
        Paragraph(
            "Apr&egrave;s la cl&ocirc;ture technique de M1, une revue automatis&eacute;e a &eacute;t&eacute; men&eacute;e "
            "par 4 agents en parall&egrave;le (revue de code, refactoring, performance, "
            "s&eacute;curit&eacute; OWASP). Les 14 corrections issues de cette revue ont &eacute;t&eacute; livr&eacute;es "
            "via deux PR distincts, fusionn&eacute;s avec CI verte&nbsp;:",
            styles["Body"],
        )
    )

    pr_rows = [
        [
            Paragraph("<b>Pull request</b>", styles["TableHeader"]),
            Paragraph("<b>Contenu</b>", styles["TableHeader"]),
            Paragraph("<b>Tests</b>", styles["TableHeader"]),
        ],
        [
            Paragraph("PR #20 &mdash; Tier 1 retro fixes", styles["TableCellBold"]),
            Paragraph(
                "8 corrections (s&eacute;curit&eacute; IPC, lockout brute-force, redact secrets, "
                "guards Electron, isolation cl&eacute;s persistance, contrats de tests).",
                styles["TableCell"],
            ),
            Paragraph("+13 (91&rarr;104)", styles["TableCell"]),
        ],
        [
            Paragraph("PR #21 &mdash; Quality gate follow-ups", styles["TableCellBold"]),
            Paragraph(
                "6 corrections (timing-safe compare durci, s&eacute;paration trust-proxy, "
                "balayage des compteurs, redact body.code, JSDoc, hoist URL parse).",
                styles["TableCell"],
            ),
            Paragraph("+2 (104&rarr;106)", styles["TableCell"]),
        ],
    ]
    pr_table = Table(pr_rows, colWidths=[5 * cm, 9 * cm, 3 * cm], hAlign="LEFT", repeatRows=1)
    pr_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(pr_table)

    story.append(PageBreak())

    # ---- 5. ARCHITECTURE -------------------------------------------------

    story.append(Paragraph("5. Architecture livr&eacute;e", styles["H1"]))
    story.append(
        Paragraph(
            "Trois applications joueurs et un serveur local fonctionnent ensemble en r&eacute;seau "
            "<b>local exclusivement</b> (aucun appel HTTP externe en runtime, aucune t&eacute;l&eacute;m&eacute;trie).",
            styles["Body"],
        )
    )

    arch_rows = [
        [
            Paragraph("<b>Composant</b>", styles["TableHeader"]),
            Paragraph("<b>Plateforme cible</b>", styles["TableHeader"]),
            Paragraph("<b>Stack</b>", styles["TableHeader"]),
            Paragraph("<b>R&ocirc;le</b>", styles["TableHeader"]),
        ],
        [
            Paragraph("Attaque de Bots", styles["TableCellBold"]),
            Paragraph("Tablette Android 10\"", styles["TableCell"]),
            Paragraph("React Native, kiosk Screen Pinning", styles["TableCell"]),
            Paragraph("App joueur principale (&eacute;nigmes Espace 2)", styles["TableCell"]),
        ],
        [
            Paragraph("Assaut", styles["TableCellBold"]),
            Paragraph("PC mallette Windows 10/11", styles["TableCell"]),
            Paragraph("Electron + React, kiosk triple-verrou", styles["TableCell"]),
            Paragraph("App joueur Espace 3 (&laquo; Section 13 &raquo;)", styles["TableCell"]),
        ],
        [
            Paragraph("D&eacute;briefing", styles["TableCellBold"]),
            Paragraph("Smartphone Android (GM)", styles["TableCell"]),
            Paragraph("React Native, kiosk Screen Pinning", styles["TableCell"]),
            Paragraph("Agr&eacute;gation fin de session, slides projection", styles["TableCell"]),
        ],
        [
            Paragraph("Server NUC", styles["TableCellBold"]),
            Paragraph("Intel NUC, Ubuntu 22.04 LTS", styles["TableCell"]),
            Paragraph("Node.js, ws, better-sqlite3, Express, Zod, pino", styles["TableCell"]),
            Paragraph("Agr&eacute;gation, persistance, reset, diag", styles["TableCell"]),
        ],
    ]
    arch_table = Table(arch_rows, colWidths=[3 * cm, 4.2 * cm, 5.8 * cm, 4 * cm], hAlign="LEFT", repeatRows=1)
    arch_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(arch_table)

    story.append(Spacer(1, 14))

    story.append(Paragraph("Garanties d'architecture", styles["H2"]))
    guarantees = [
        ("100&nbsp;% offline", "Aucun appel HTTP sortant en runtime. Aucune t&eacute;l&eacute;m&eacute;trie. M&eacute;dias bundl&eacute;s."),
        ("Sch&eacute;mas typ&eacute;s end-to-end", "Tous les messages WebSocket sont valid&eacute;s par Zod aux deux extr&eacute;mit&eacute;s. Aucun champ <code>any</code>."),
        ("Persistance r&eacute;sistante au crash", "Force-stop pendant un keystroke r&eacute;tablit l'&eacute;tat exact au prochain boot."),
        ("Auth &laquo; reset &raquo; durcie", "Code de reset par session, comparaison constante en temps, lockout 5/60s par IP."),
        ("Kiosque triple-verrou", "BrowserWindow + globalShortcut + politique de session Windows (responsabilit&eacute; client)."),
        ("CI multi-plateforme", "Build APK Android et EXE Windows valid&eacute;s &agrave; chaque commit."),
    ]
    guarantee_rows = []
    for label, desc in guarantees:
        guarantee_rows.append([
            Paragraph(f"<b>{label}</b>", styles["TableCell"]),
            Paragraph(desc, styles["TableCell"]),
        ])
    guarantee_table = Table(guarantee_rows, colWidths=[5 * cm, 12 * cm], hAlign="LEFT")
    guarantee_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, 0), (0, -1), SUBTLE),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
                ("LINEABOVE", (0, 0), (-1, 0), 0.5, BORDER),
            ]
        )
    )
    story.append(guarantee_table)

    story.append(PageBreak())

    # ---- 6. HORS-PERIMETRE ----------------------------------------------

    story.append(Paragraph("6. Hors-p&eacute;rim&egrave;tre M1 (par construction)", styles["H1"]))
    story.append(
        Paragraph(
            "Les &eacute;l&eacute;ments suivants <b>n'&eacute;taient pas inclus</b> dans le jalon M1 et sont report&eacute;s "
            "aux jalons suivants ou &agrave; des d&eacute;pendances client / graphiste.",
            styles["Body"],
        )
    )

    oos_rows = [
        [
            Paragraph("<b>&Eacute;l&eacute;ment</b>", styles["TableHeader"]),
            Paragraph("<b>Statut</b>", styles["TableHeader"]),
            Paragraph("<b>D&eacute;blocage</b>", styles["TableHeader"]),
        ],
        [
            Paragraph("Int&eacute;gration des maquettes finales (UX/UI)", styles["TableCell"]),
            Paragraph("Plac&eacute; en M2", styles["TableCellBold"]),
            Paragraph("D&eacute;pend de la validation par le client des maquettes Laura.", styles["TableCell"]),
        ],
        [
            Paragraph("M&eacute;dias finaux (vid&eacute;os, sons, images)", styles["TableCell"]),
            Paragraph("Plac&eacute; en M2/M3", styles["TableCellBold"]),
            Paragraph("Plac&eacute;s en bundle local d&egrave;s livraison c&ocirc;t&eacute; client (placeholders en M1).", styles["TableCell"]),
        ],
        [
            Paragraph("Contenu narratif (textes, codes, &eacute;nigmes)", styles["TableCell"]),
            Paragraph("Plac&eacute; en M3", styles["TableCellBold"]),
            Paragraph("D&eacute;pend du document maquette des &eacute;nigmes finales.", styles["TableCell"]),
        ],
        [
            Paragraph("D&eacute;ploiement physique sur NUC + tablettes finales", styles["TableCell"]),
            Paragraph("Plac&eacute; en M5", styles["TableCellBold"]),
            Paragraph("Mat&eacute;riel non encore command&eacute; ; le PC mallette est en cours de validation.", styles["TableCell"]),
        ],
        [
            Paragraph("R&eacute;cup&eacute;ration vid&eacute;os (Espace 2 &laquo; vid&eacute;osurveillance &raquo;)", styles["TableCell"]),
            Paragraph("Plac&eacute; en M3", styles["TableCellBold"]),
            Paragraph("Sources mp4 attendues du client &agrave; partir de mi-mai.", styles["TableCell"]),
        ],
    ]
    oos_table = Table(oos_rows, colWidths=[7 * cm, 3.5 * cm, 6.5 * cm], hAlign="LEFT", repeatRows=1)
    oos_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(oos_table)

    story.append(Spacer(1, 14))

    story.append(Paragraph("Limitations document&eacute;es", styles["H2"]))
    story.append(
        Paragraph(
            "Conform&eacute;ment au cahier des charges, deux limitations syst&egrave;me ont &eacute;t&eacute; "
            "explicitement document&eacute;es&nbsp;:",
            styles["Body"],
        )
    )
    story.append(
        Paragraph(
            "<b>1.</b> Sur Windows, <b>Ctrl+Alt+Del ne peut &ecirc;tre intercept&eacute; depuis user-mode</b>. "
            "C'est une garantie noyau (<i>secure attention sequence</i>). La mitigation est cl&ocirc;tur&eacute;e par "
            "une politique de session Windows applicable c&ocirc;t&eacute; client (instructions dans le README de l'app Assaut).",
            styles["Body"],
        )
    )
    story.append(
        Paragraph(
            "<b>2.</b> Sur Android, <b>Screen Pinning peut &ecirc;tre rompu par un appui maintenu Back+Recents</b> "
            "(comportement OEM-d&eacute;pendant). La mitigation est l'application d'une politique &laquo; pas d'acc&egrave;s aux Settings &raquo; "
            "via un MDM (Device Owner) ; cette &eacute;tape sera trait&eacute;e en M5.",
            styles["Body"],
        )
    )

    story.append(PageBreak())

    # ---- 7. PROCHAINES ETAPES -------------------------------------------

    story.append(Paragraph("7. Prochaines &eacute;tapes", styles["H1"]))

    story.append(Paragraph("M2 &mdash; Int&eacute;gration visuelle", styles["H2"]))
    story.append(
        Paragraph(
            "D&eacute;clenchement&nbsp;: validation des maquettes Laura par le client. "
            "Dur&eacute;e estim&eacute;e&nbsp;: 5-7 jours ouvr&eacute;s. Livrable&nbsp;: "
            "trois apps utilisant la palette finale, la typographie maquett&eacute;e et "
            "les composants design-system extraits.",
            styles["Body"],
        )
    )
    story.append(
        Paragraph(
            "<b>Action client requise avant M2&nbsp;:</b><br/>"
            "&bull; Validation des maquettes par Nathana&euml;l (ou retours formalis&eacute;s &agrave; Laura).<br/>"
            "&bull; Clarification de la nomenclature dossier <i>App_Assaut/</i> (contenait des &eacute;crans portrait "
            "qui ressemblent &agrave; D&eacute;briefing &mdash; &agrave; clarifier avec Laura).",
            styles["Body"],
        )
    )

    story.append(Paragraph("M3 &mdash; Contenu narratif &amp; m&eacute;dias", styles["H2"]))
    story.append(
        Paragraph(
            "Int&eacute;gration des textes finaux, des audio/vid&eacute;o, des matrices d'&eacute;nigmes A/B/C/D, "
            "et de la s&eacute;quence Section&nbsp;13. D&eacute;pend de la livraison contenus c&ocirc;t&eacute; client.",
            styles["Body"],
        )
    )

    story.append(Paragraph("M4-M5 &mdash; Tests terrain &amp; d&eacute;ploiement", styles["H2"]))
    story.append(
        Paragraph(
            "Sessions blanches sur le mat&eacute;riel cible (PC mallette, tablettes), "
            "calibration du r&eacute;seau Wi-Fi mesh, formation GM, livraison du NUC pr&ecirc;t-&agrave;-brancher. "
            "Pr&eacute;-requis&nbsp;: PC mallette command&eacute; et r&eacute;ceptionn&eacute;.",
            styles["Body"],
        )
    )

    story.append(Spacer(1, 16))

    story.append(Paragraph("Calendrier indicatif", styles["H2"]))
    cal_rows = [
        [
            Paragraph("<b>Jalon</b>", styles["TableHeader"]),
            Paragraph("<b>Fen&ecirc;tre cible</b>", styles["TableHeader"]),
            Paragraph("<b>D&eacute;pendances client</b>", styles["TableHeader"]),
        ],
        [
            Paragraph("M1 &mdash; Socle technique", styles["TableCellBold"]),
            Paragraph("28 avr. &mdash; 7 mai 2026", styles["TableCell"]),
            Paragraph("Validation visio (le 7 mai)", styles["TableCell"]),
        ],
        [
            Paragraph("M2 &mdash; Int&eacute;gration visuelle", styles["TableCellBold"]),
            Paragraph("12 &mdash; 22 mai 2026 (estim&eacute;)", styles["TableCell"]),
            Paragraph("Maquettes Laura valid&eacute;es", styles["TableCell"]),
        ],
        [
            Paragraph("M3 &mdash; Contenu &amp; narration", styles["TableCellBold"]),
            Paragraph("23 mai &mdash; 5 juin 2026 (estim&eacute;)", styles["TableCell"]),
            Paragraph("Textes finaux, m&eacute;dias, &eacute;nigmes", styles["TableCell"]),
        ],
        [
            Paragraph("M4 &mdash; Tests sessions blanches", styles["TableCellBold"]),
            Paragraph("8 &mdash; 19 juin 2026 (estim&eacute;)", styles["TableCell"]),
            Paragraph("Mat&eacute;riel &agrave; demeure (PC, tablettes, NUC)", styles["TableCell"]),
        ],
        [
            Paragraph("M5 &mdash; D&eacute;ploiement final", styles["TableCellBold"]),
            Paragraph("22 &mdash; 30 juin 2026 (estim&eacute;)", styles["TableCell"]),
            Paragraph("Validation MDM tablettes, signature recette", styles["TableCell"]),
        ],
    ]
    cal_table = Table(cal_rows, colWidths=[5.5 * cm, 5 * cm, 6.5 * cm], hAlign="LEFT", repeatRows=1)
    cal_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(cal_table)

    story.append(PageBreak())

    # ---- 8. VALIDATION CLIENT --------------------------------------------

    story.append(Paragraph("8. Validation client &mdash; bon &agrave; tirer", styles["H1"]))
    story.append(
        Paragraph(
            "&Agrave; remplir lors de l'atelier de revue du <b>jeudi 7 mai 2026, 15h00</b>. "
            "La signature ci-dessous d&eacute;clenche la pose du tag <code>v0.1.0</code> et "
            "l'&eacute;mission de la facture du jalon M1 (4 200 &euro; HT).",
            styles["Body"],
        )
    )

    story.append(Spacer(1, 8))
    story.append(Paragraph("D&eacute;monstration en direct &mdash; checklist client", styles["H2"]))

    demo_rows = [
        [
            Paragraph("<b>&Eacute;tape de la d&eacute;monstration</b>", styles["TableHeader"]),
            Paragraph("<b>Validation</b>", styles["TableHeader"]),
        ],
        [
            Paragraph(
                "<b>1. Lancement des trois apps en mode kiosque.</b> "
                "Les raccourcis Alt+Tab, Win, Home, Back, swipes sont test&eacute;s en direct&nbsp;: "
                "aucun ne permet de sortir.",
                styles["TableCell"],
            ),
            Paragraph("&#9633;&nbsp;&nbsp;Conforme &nbsp;&nbsp; &#9633;&nbsp;&nbsp;Non conforme", styles["TableCell"]),
        ],
        [
            Paragraph(
                "<b>2. Diagnostic r&eacute;seau vert.</b> "
                "Chaque app affiche le NUC connect&eacute;. D&eacute;branchement &rarr; rouge en &lt;&nbsp;2&nbsp;s. "
                "Reconnexion &rarr; vert en &lt;&nbsp;5&nbsp;s.",
                styles["TableCell"],
            ),
            Paragraph("&#9633;&nbsp;&nbsp;Conforme &nbsp;&nbsp; &#9633;&nbsp;&nbsp;Non conforme", styles["TableCell"]),
        ],
        [
            Paragraph(
                "<b>3. S&eacute;lection &eacute;quipe et avancement.</b> "
                "&Eacute;quipe 7 s&eacute;lectionn&eacute;e sur Attaque de Bots, deux &eacute;tapes franchies, "
                "setup en moins de 30&nbsp;s.",
                styles["TableCell"],
            ),
            Paragraph("&#9633;&nbsp;&nbsp;Conforme &nbsp;&nbsp; &#9633;&nbsp;&nbsp;Non conforme", styles["TableCell"]),
        ],
        [
            Paragraph(
                "<b>4. Test de persistance.</b> "
                "Force-reboot de la tablette pendant l'&eacute;tape&nbsp;3. "
                "L'app red&eacute;marre directement sur l'&eacute;quipe&nbsp;7 &agrave; l'&eacute;tape&nbsp;3, "
                "sans flash de l'&eacute;cran de s&eacute;lection.",
                styles["TableCell"],
            ),
            Paragraph("&#9633;&nbsp;&nbsp;Conforme &nbsp;&nbsp; &#9633;&nbsp;&nbsp;Non conforme", styles["TableCell"]),
        ],
        [
            Paragraph(
                "<b>5. Pipeline CI vert.</b> "
                "Onglet Actions de GitHub, 5 jobs verts (lint, typecheck, test, build APK, build EXE). "
                "T&eacute;l&eacute;chargement d'un artifact APK et EXE r&eacute;ussi.",
                styles["TableCell"],
            ),
            Paragraph("&#9633;&nbsp;&nbsp;Conforme &nbsp;&nbsp; &#9633;&nbsp;&nbsp;Non conforme", styles["TableCell"]),
        ],
    ]
    demo_table = Table(demo_rows, colWidths=[12 * cm, 5 * cm], hAlign="LEFT", repeatRows=1)
    demo_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(demo_table)

    story.append(Spacer(1, 14))

    story.append(Paragraph("Bon &agrave; tirer", styles["H2"]))
    story.append(
        Paragraph(
            "Si les 5 &eacute;tapes ci-dessus sont conformes, le jalon M1 est valid&eacute;. "
            "En cas de non-conformit&eacute;, un <i>punch list</i> est dress&eacute; et une nouvelle "
            "session de validation est planifi&eacute;e sous 5 jours ouvr&eacute;s &mdash; aucune "
            "facturation tant que la validation n'est pas concluante.",
            styles["Body"],
        )
    )

    story.append(Spacer(1, 16))

    sig_rows = [
        [
            Paragraph("<b>Pour The Game</b>", styles["SignLabel"]),
            Paragraph("<b>Pour le prestataire</b>", styles["SignLabel"]),
        ],
        [
            Paragraph(
                "Nathana&euml;l Masson<br/>Fondateur, The Game<br/><br/>"
                "Date&nbsp;: ____________________<br/><br/>"
                "Signature&nbsp;:",
                styles["BodySmall"],
            ),
            Paragraph(
                "Georges<br/>SMK Studios<br/><br/>"
                "Date&nbsp;: ____________________<br/><br/>"
                "Signature&nbsp;:",
                styles["BodySmall"],
            ),
        ],
        [
            Paragraph("&nbsp;", styles["BodySmall"]),
            Paragraph("&nbsp;", styles["BodySmall"]),
        ],
    ]
    sig_table = Table(sig_rows, colWidths=[8.5 * cm, 8.5 * cm], rowHeights=[None, None, 2.5 * cm], hAlign="LEFT")
    sig_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("BACKGROUND", (0, 0), (-1, -1), SUBTLE),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, BORDER),
                ("LINEAFTER", (0, 0), (0, -1), 0.5, BORDER),
            ]
        )
    )
    story.append(sig_table)

    story.append(PageBreak())

    # ---- 9. ANNEXES ------------------------------------------------------

    story.append(Paragraph("9. Annexes", styles["H1"]))

    story.append(Paragraph("Acc&egrave;s techniques", styles["H2"]))
    annex_rows = [
        [
            Paragraph("<b>D&eacute;p&ocirc;t source</b>", styles["TableCell"]),
            Paragraph("<a href='https://github.com/gs-imak/code-rouge'>github.com/gs-imak/code-rouge</a>", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Pipelines CI</b>", styles["TableCell"]),
            Paragraph("<a href='https://github.com/gs-imak/code-rouge/actions'>github.com/gs-imak/code-rouge/actions</a>", styles["TableCell"]),
        ],
        [
            Paragraph("<b>T&eacute;l&eacute;chargement des binaires</b>", styles["TableCell"]),
            Paragraph("Onglet Actions &rarr; dernier run vert &rarr; section Artifacts (APK + EXE)", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Documentation interne</b>", styles["TableCell"]),
            Paragraph("<i>docs/architecture.md</i>, <i>docs/m1-plan.md</i>, <i>docs/glossary.md</i>", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Acc&egrave;s collaborateur</b>", styles["TableCell"]),
            Paragraph("Compte GitHub <i>NathanaelTG</i> ajout&eacute; en lecture", styles["TableCell"]),
        ],
    ]
    annex_table = Table(annex_rows, colWidths=[5 * cm, 12 * cm], hAlign="LEFT")
    annex_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, 0), (0, -1), SUBTLE),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
                ("LINEABOVE", (0, 0), (-1, 0), 0.5, BORDER),
            ]
        )
    )
    story.append(annex_table)

    story.append(Spacer(1, 14))

    story.append(Paragraph("Contacts", styles["H2"]))
    contact_rows = [
        [
            Paragraph("<b>R&ocirc;le</b>", styles["TableHeader"]),
            Paragraph("<b>Nom</b>", styles["TableHeader"]),
            Paragraph("<b>Contact</b>", styles["TableHeader"]),
        ],
        [
            Paragraph("Client / Fondateur", styles["TableCell"]),
            Paragraph("Nathana&euml;l Masson", styles["TableCell"]),
            Paragraph("(via The Game)", styles["TableCell"]),
        ],
        [
            Paragraph("Prestataire technique", styles["TableCell"]),
            Paragraph("Georges &mdash; SMK Studios", styles["TableCell"]),
            Paragraph("info@newnow.group", styles["TableCell"]),
        ],
        [
            Paragraph("Graphiste UX/UI", styles["TableCell"]),
            Paragraph("Laura", styles["TableCell"]),
            Paragraph("(coordonn&eacute;es g&eacute;r&eacute;es par le client)", styles["TableCell"]),
        ],
    ]
    contact_table = Table(contact_rows, colWidths=[5 * cm, 6 * cm, 6 * cm], hAlign="LEFT", repeatRows=1)
    contact_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SUBTLE]),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, BORDER),
            ]
        )
    )
    story.append(contact_table)

    story.append(Spacer(1, 14))

    story.append(Paragraph("Glossaire express", styles["H2"]))
    glossary_text = (
        "<b>Kiosque</b>&nbsp;: mode plein-&eacute;cran verrouill&eacute; emp&ecirc;chant l'utilisateur de quitter l'application. "
        "<b>NUC</b>&nbsp;: mini-PC Intel servant de serveur local sur site. "
        "<b>WebSocket</b>&nbsp;: canal de communication temps r&eacute;el bidirectionnel entre app et serveur. "
        "<b>CI</b>&nbsp;: int&eacute;gration continue, syst&egrave;me automatique qui v&eacute;rifie la qualit&eacute; du code &agrave; chaque modification. "
        "<b>Force-stop</b>&nbsp;: arr&ecirc;t brutal d'une app par le syst&egrave;me d'exploitation (simule un crash ou coupure de courant). "
        "<b>Tag <code>v0.1.0</code></b>&nbsp;: marquage Git qui fige une version de r&eacute;f&eacute;rence valid&eacute;e."
    )
    story.append(Paragraph(glossary_text, styles["Body"]))

    story.append(Spacer(1, 14))

    story.append(Paragraph("Mentions", styles["H2"]))
    story.append(
        Paragraph(
            "Document confidentiel &mdash; r&eacute;dig&eacute; pour Nathana&euml;l Masson, The Game. "
            "Reproduction et diffusion limit&eacute;es aux parties prenantes du projet Code Rouge. "
            "Version 1.0 g&eacute;n&eacute;r&eacute;e le 6 mai 2026 &agrave; partir des sources publiques du d&eacute;p&ocirc;t. "
            "Toute mise &agrave; jour ult&eacute;rieure (post-validation) sera num&eacute;rot&eacute;e v1.x.",
            styles["Caption"],
        )
    )

    doc.build(story)
    print(f"OK -> {out_path}")


# Helper to switch page templates mid-flow.
class SwitchTemplate:
    def __init__(self, template_id: str):
        self.template_id = template_id

    def wrap(self, *args, **kwargs):  # pragma: no cover - reportlab plumbing
        return (0, 0)

    def draw(self):  # pragma: no cover
        pass

    def drawOn(self, canvas, x, y, _sW=0):  # pragma: no cover
        pass


# NextPageTemplate is a flowable that switches the page template at the next
# break. Use it directly; replace the SwitchTemplate placeholder above.
from reportlab.platypus.doctemplate import NextPageTemplate  # noqa: E402


def _patched_switch(template_id: str):
    return NextPageTemplate(template_id)


SwitchTemplate = _patched_switch  # type: ignore[assignment,misc]


if __name__ == "__main__":
    build()
