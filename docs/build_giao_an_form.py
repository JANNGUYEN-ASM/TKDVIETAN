#!/usr/bin/env python3
"""Giáo án form layout giống mẫu (ô trắng trên nền đậm) — phong cách Taekwondo Việt An."""

from __future__ import annotations

import runpy
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "Giao-an-CLB-Viet-An-Cap-10-den-Cap-1.docx"
LOGO = ROOT.parent / "public" / "logo-viet-an.png"

# Theme Taekwondo Việt An: đen – vàng kim – đỏ – trắng
NAVY = "111111"
GOLD = "F5B800"
RED = "C62828"
WHITE = "FFFFFF"
LABEL = RGBColor(0x44, 0x44, 0x44)
INK = RGBColor(0x11, 0x11, 0x11)

# Load curriculum data without running build()
_ns = runpy.run_path(str(ROOT / "build_giao_an.py"), run_name="form_data")
BELTS = _ns["BELTS"]


def set_run_font(run, size=10, bold=False, color=None, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    if color is not None:
        run.font.color.rgb = color


def shade(cell, hex_color: str):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    for child in list(tc_pr):
        if child.tag == qn("w:shd"):
            tc_pr.remove(child)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tc_pr.append(shd)


def borders(cell, color=NAVY, sz=12):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        tc_borders.append(el)
    tc_pr.append(tc_borders)


def cell_margin(cell, top=60, bottom=60, left=80, right=80):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for name, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        node = OxmlElement(f"w:{name}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        mar.append(node)
    tc_pr.append(mar)


def set_row_height(row, cm: float, rule="atLeast"):
    tr = row._tr
    tr_pr = tr.get_or_add_trPr()
    for child in list(tr_pr):
        if child.tag == qn("w:trHeight"):
            tr_pr.remove(child)
    th = OxmlElement("w:trHeight")
    th.set(qn("w:val"), str(int(cm * 567)))
    th.set(qn("w:hRule"), rule)
    tr_pr.append(th)


def clear_cell(cell):
    cell.text = ""
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)


def fill_box(cell, label: str, body: str = "", *, min_lines: int = 0):
    """Ô trắng giống mẫu: nhãn góc trên trái + nội dung bên dưới."""
    clear_cell(cell)
    shade(cell, WHITE)
    borders(cell, NAVY, 14)
    cell_margin(cell)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP

    p0 = cell.paragraphs[0]
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(4)
    r0 = p0.add_run(label)
    set_run_font(r0, size=9, bold=True, color=LABEL)

    text = (body or "").strip("\n")
    lines = text.split("\n") if text else []
    if not lines and min_lines:
        lines = [""] * min_lines

    for line in lines:
        p = cell.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(line if line.strip() else " ")
        set_run_font(run, size=10, color=INK)


def add_gap(doc, pt: float = 6):
    """Khe nền đậm giữa các ô — giống khoảng xanh trong mẫu."""
    gap = doc.add_table(rows=1, cols=1)
    cell = gap.rows[0].cells[0]
    shade(cell, NAVY)
    borders(cell, NAVY, 2)
    clear_cell(cell)
    set_row_height(gap.rows[0], max(pt / 28.35, 0.18), "exact")
    set_col_widths(gap, [16.8])


def set_doc_background(doc, hex_color: str):
    background = OxmlElement("w:background")
    background.set(qn("w:color"), hex_color)
    doc.element.insert(0, background)
    # display background in print view
    settings = doc.settings.element
    disp = OxmlElement("w:displayBackgroundShape")
    settings.append(disp)


def set_col_widths(table, widths_cm):
    for row in table.rows:
        for i, w in enumerate(widths_cm):
            if i < len(row.cells):
                row.cells[i].width = Cm(w)


def add_title_bar(doc):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    cell = table.rows[0].cells[0]
    shade(cell, NAVY)
    borders(cell, GOLD, 18)
    cell_margin(cell, top=80, bottom=80, left=100, right=100)
    clear_cell(cell)

    # logo + title
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    if LOGO.exists():
        run = p.add_run()
        run.add_picture(str(LOGO), height=Cm(1.1))
        p.add_run("  ")

    r1 = p.add_run("GIÁO ÁN")
    set_run_font(r1, size=22, bold=True, color=RGBColor(0xF5, 0xB8, 0x00), name="Arial")

    p2 = cell.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run("CLB TAEKWONDO VIỆT AN  ·  태권도")
    set_run_font(r2, size=9, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF), name="Arial")

    # red accent stripe under title
    stripe = doc.add_table(rows=1, cols=5)
    stripe.autofit = False
    colors = ["F5F5F5", "F5C518", "2E8B57", "1E5AA8", "C8102E"]  # trắng–vàng–lá–xanh–đỏ
    for i, c in enumerate(colors):
        shade(stripe.rows[0].cells[i], c)
        borders(stripe.rows[0].cells[i], c, 4)
        clear_cell(stripe.rows[0].cells[i])
    set_row_height(stripe.rows[0], 0.25, "exact")
    set_col_widths(stripe, [3.4, 3.4, 3.4, 3.4, 3.4])
    add_gap(doc, 8)


def add_form_page(
    doc,
    *,
    lop: str,
    mon: str,
    ngay: str,
    chu_de: str,
    bai_hoc: str,
    muc_dich: str,
    vat_dung: str,
    muc_tieu: str,
    cau_truc: str,
    danh_gia: str,
    blank: bool = False,
):
    """Một trang form đúng bố cục mẫu."""
    add_title_bar(doc)

    # Row: Lớp | Môn học | Ngày
    t = doc.add_table(rows=1, cols=3)
    t.autofit = False
    fill_box(t.rows[0].cells[0], "Lớp:", lop if not blank else "", min_lines=1)
    fill_box(t.rows[0].cells[1], "Môn học:", mon if not blank else "Taekwondo", min_lines=1)
    fill_box(t.rows[0].cells[2], "Ngày:", ngay if not blank else "", min_lines=1)
    set_row_height(t.rows[0], 1.35)
    set_col_widths(t, [5.6, 5.6, 5.6])
    add_gap(doc, 6)

    # Row: Chủ đề | Bài học #
    t = doc.add_table(rows=1, cols=2)
    t.autofit = False
    fill_box(t.rows[0].cells[0], "Chủ đề:", chu_de if not blank else "", min_lines=1)
    fill_box(t.rows[0].cells[1], "Bài học #:", bai_hoc if not blank else "", min_lines=1)
    set_row_height(t.rows[0], 1.35)
    set_col_widths(t, [11.5, 5.3])
    add_gap(doc, 6)

    # Mục đích
    t = doc.add_table(rows=1, cols=1)
    fill_box(
        t.rows[0].cells[0],
        "Mục đích và Trọng tâm Bài học:",
        muc_dich if not blank else "",
        min_lines=3 if blank else 0,
    )
    set_row_height(t.rows[0], 2.2)
    set_col_widths(t, [16.8])
    add_gap(doc, 6)

    # Vật dụng | Mục tiêu
    t = doc.add_table(rows=1, cols=2)
    t.autofit = False
    fill_box(
        t.rows[0].cells[0],
        "Vật dụng Cần thiết:",
        vat_dung if not blank else "",
        min_lines=4 if blank else 0,
    )
    fill_box(
        t.rows[0].cells[1],
        "Mục tiêu Học tập:",
        muc_tieu if not blank else "",
        min_lines=4 if blank else 0,
    )
    set_row_height(t.rows[0], 3.2)
    set_col_widths(t, [8.4, 8.4])
    add_gap(doc, 6)

    # Cấu trúc / Hoạt động — ô lớn
    t = doc.add_table(rows=1, cols=1)
    fill_box(
        t.rows[0].cells[0],
        "Cấu trúc / Hoạt động:",
        cau_truc if not blank else "",
        min_lines=12 if blank else 0,
    )
    set_row_height(t.rows[0], 8.5)
    set_col_widths(t, [16.8])
    add_gap(doc, 6)

    # Đánh giá
    t = doc.add_table(rows=1, cols=1)
    fill_box(
        t.rows[0].cells[0],
        "Đánh giá:",
        danh_gia if not blank else "",
        min_lines=3 if blank else 0,
    )
    set_row_height(t.rows[0], 2.4)
    set_col_widths(t, [16.8])


def format_day_blocks(day_name: str, blocks) -> str:
    lines = [f"• {day_name}"]
    for gio, phut, viec in blocks:
        short = viec.replace("\n", " ")
        if len(short) > 160:
            short = short[:157] + "…"
        lines.append(f"  {gio} ({phut}'): {short}")
    return "\n".join(lines)


def week_activity(day_a, day_b, day_c) -> str:
    parts = [
        "Phần mở đầu + khởi động chung: theo giáo án khung 18:00–18:25 (cả sàn).",
        "",
        "PHẦN CƠ BẢN (18:25–19:05) — theo trạm đai:",
        format_day_blocks("Ngày A", day_a),
        "",
        format_day_blocks("Ngày B", day_b),
        "",
        format_day_blocks("Ngày C", day_c),
        "",
        "19:05–19:20: Thể lực / nhào lộn / song đấu theo tầng đai.",
        "19:20–19:30: Giãn – nhận xét – giao bài nhà – chào.",
    ]
    return "\n".join(parts)


def default_gear(belt) -> str:
    items = [
        "Dobok, đai đúng cấp",
        "Đích cầm tay / đích đá",
        "Thảm nhào lộn",
        "Nước uống",
    ]
    if "spar" in belt["sparring"].lower() or "hiệp" in belt["sparring"].lower() or "song đấu" in belt["sparring"].lower():
        if "chưa" not in belt["sparring"].lower() and "không" not in belt["sparring"].lower():
            items.append("Bảo hộ: răng, ống chân, cẳng tay, giáp (nếu spar)")
    return "\n".join(f"• {x}" for x in items)


def build():
    doc = Document()
    set_doc_background(doc, NAVY)
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(0.9)
        section.bottom_margin = Cm(0.9)
        section.left_margin = Cm(1.0)
        section.right_margin = Cm(1.0)

    # ---- Trang hướng dẫn ----
    add_title_bar(doc)
    t = doc.add_table(rows=1, cols=1)
    fill_box(
        t.rows[0].cells[0],
        "Hướng dẫn dùng form:",
        "\n".join(
            [
                "• Bố cục form bám mẫu giáo án ô trắng (Lớp / Môn / Ngày → Chủ đề / Bài # → Mục đích → Vật dụng|Mục tiêu → Cấu trúc → Đánh giá).",
                "• Nền chữ vàng–đen, sọc đai trắng–vàng–lá–xanh–đỏ theo brand CLB Việt An (thay theme biển).",
                "• Trang sau: MẪU TRỐNG để photocopy / điền tay.",
                "• Tiếp theo: mỗi TUẦN của mỗi cấp = 1 trang form đã điền (3 buổi A/B/C nằm trong ô Cấu trúc/Hoạt động).",
                "• Phần mở đầu & kết thúc mọi buổi dùng chung khung 18:00–19:30; ô hoạt động nhấn phần cơ bản theo cấp.",
            ]
        ),
    )
    set_row_height(t.rows[0], 8.0)
    set_col_widths(t, [16.8])

    # ---- Mẫu trống ----
    doc.add_page_break()
    add_form_page(
        doc,
        lop="",
        mon="Taekwondo",
        ngay="",
        chu_de="",
        bai_hoc="",
        muc_dich="",
        vat_dung="",
        muc_tieu="",
        cau_truc="",
        danh_gia="",
        blank=True,
    )

    # ---- Form đã điền: mỗi tuần / cấp ----
    for b in BELTS:
        for wi, week in enumerate(b["weeks"], 1):
            title, home, day_a, day_b, day_c = week
            short = title.split("—", 1)[-1].strip() if "—" in title else title
            doc.add_page_break()
            goals = "\n".join(f"• {c}" for c in b["check"][:4])
            if len(b["check"]) > 4:
                goals += "\n• … (xem checklist đủ khi gần thi)"
            add_form_page(
                doc,
                lop=f"Trạm theo cấp — {b['holding']}",
                mon="Taekwondo",
                ngay=f"Tuần {wi}/12  ·  3 buổi (A/B/C)",
                chu_de=f"{b['holding']} → thi {b['next']}: {short}",
                bai_hoc=f"{b['code']}-T{wi:02d}",
                muc_dich=(
                    f"Trọng tâm tuần: {short}.\n"
                    f"Chuẩn bị thi lên {b['next']} (tối thiểu 3 tháng).\n"
                    f"Khi đậu đeo: {b['color']}.\n"
                    f"Độ tuổi/quý: {b['age']}"
                ),
                vat_dung=default_gear(b),
                muc_tieu=(
                    f"Cuối tuần HS:\n{goals}\n\n"
                    f"Bài tập về nhà:\n• {home}"
                ),
                cau_truc=week_activity(day_a, day_b, day_c),
                danh_gia=(
                    "• Quan sát kỹ thuật đúng/sai trên sàn; sửa ngay.\n"
                    "• Tuần 11: thi thử theo phiếu — ghi đạt/chưa từng phần.\n"
                    "• Tuần 12: chỉ sửa lỗi đã ghi, không thêm đòn mới.\n"
                    "• Cuối tháng: phiếu tố chất (nhanh, mạnh, bền, dẻo, khéo, tập trung, cao, cân) — HLV ký."
                ),
            )

    doc.save(OUT)
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")

    # Mẫu trống 1 trang — photocopy / điền tay
    blank = Document()
    set_doc_background(blank, NAVY)
    for section in blank.sections:
        section.top_margin = Cm(0.9)
        section.bottom_margin = Cm(0.9)
        section.left_margin = Cm(1.0)
        section.right_margin = Cm(1.0)
    add_form_page(
        blank,
        lop="",
        mon="Taekwondo",
        ngay="",
        chu_de="",
        bai_hoc="",
        muc_dich="",
        vat_dung="",
        muc_tieu="",
        cau_truc="",
        danh_gia="",
        blank=True,
    )
    blank_out = ROOT / "Mau-form-giao-an-Taekwondo-Viet-An.docx"
    blank.save(blank_out)
    print(f"Wrote {blank_out} ({blank_out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
