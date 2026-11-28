#!/usr/bin/env python3
"""Build CLB Việt An color-belt lesson plan Word document."""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

OUT = Path(__file__).with_name("Giao-an-CLB-Viet-An-Cap-10-den-Cap-1.docx")


def set_run_font(run, size=11, bold=False):
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    run.bold = bold


def add_p(doc, text, *, bold=False, size=11, space_after=6, align=None):
    p = doc.add_paragraph()
    if align is not None:
        p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    return p


def add_h(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        set_run_font(run, size=16 if level == 1 else 13 if level == 2 else 12, bold=True)
    return h


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(item)
        set_run_font(run)


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(h)
        set_run_font(run, bold=True, size=10)
    for r_i, row in enumerate(rows):
        for c_i, val in enumerate(row):
            cell = table.rows[r_i + 1].cells[c_i]
            cell.text = ""
            p = cell.paragraphs[0]
            run = p.add_run(str(val))
            set_run_font(run, size=10)
    doc.add_paragraph()
    return table


def day_block(doc, title, rows):
    add_p(doc, title, bold=True, size=11, space_after=4)
    add_table(doc, ["Giờ", "Phút", "Việc làm chi tiết"], rows)


BELTS = []


def belt(
    code,
    holding,
    next_belt,
    color_when_pass,
    age,
    exam_order,
    techniques,
    checklist,
    weeks,
    tumbling,
    sparring,
    fitness,
):
    BELTS.append(
        {
            "code": code,
            "holding": holding,
            "next": next_belt,
            "color": color_when_pass,
            "age": age,
            "exam": exam_order,
            "tech": techniques,
            "check": checklist,
            "weeks": weeks,
            "tumbling": tumbling,
            "sparring": sparring,
            "fitness": fitness,
        }
    )


# --- Cấp 10 ---
belt(
    "C10",
    "Cấp 10 · Đai trắng (kể cả dưới 6 tuổi)",
    "Cấp 9",
    "Đai trắng · 1 vạch xanh dương",
    "Từ 6 tuổi tính tại Quý I mới được thi. Dưới 6 tuổi tập đúng nội dung cấp 10, chưa dự thi.",
    [
        "Chào, lệnh, thuật ngữ: dojang, dobok, sabeomnim, charyeot, kyeong-rye, joonbi, sijak, kallyeo, kyesok, geuman, baro, swieo",
        "6 tấn: moa, narani, juchum, ap, ap kubi, dwit kubi + đổi bên",
        "Đấm trung 10 lần (juchum seogi)",
        "Arae / momtong bakkat / olgul makki đi hình vuông",
        "Ap chagi (đá trước) — không phải đá ngang",
        "Phiếu tháng: nhanh, mạnh, bền, dẻo, khéo, tập trung, chiều cao, cân nặng",
    ],
    [
        ("Moa seogi", "Gót chạm, mũi hơi mở, thân thẳng, tay dọc đùi", "Chân chữ V quá rộng; nhìn sàn; vai nhún"),
        ("Narani seogi", "Rộng bằng vai, mũi thẳng, gối mềm", "Hai chân hẹp hơn vai; khóa gối"),
        ("Juchum seogi", "Rộng ~2 vai, mũi song song, gối đẩy ra, gót dính", "Gối đổ vào trong; gót nhấc; lưng cúi"),
        ("Ap kubi", "Dài ~3 bàn chân, gối trước trên cổ chân, chân sau duỗi", "Bước ngắn; gối vượt mũi chân"),
        ("Dwit kubi", "~70% lực chân sau, gối sau hướng mũi chân", "Đổ về trước; hai chân thẳng"),
        ("Momtong bakkat makki", "Cẳng tay ngoài đỡ ra, nắm ngang vai, khuỷu hạ", "Đỡ bằng lòng bàn tay; khuỷu xòe"),
        ("Ap chagi", "Nâng gối → duỗi búng bàn chân → co → đặt", "Duỗi trước khi nâng gối; đá ngang gọi nhầm ap chagi"),
        ("Đấm trung", "Nắm từ hông, xoay úp lúc chạm, tay kia kéo về", "Vai nhún; đấm từ ngực; tay kia không rút"),
    ],
    [
        "Thắt đai đúng, chào đúng 3 lần liên tiếp",
        "Làm đúng 6 tấn khi thầy gọi tên (2 vòng)",
        "Đấm trung 10 lần không nhấc gót",
        "Hình vuông 3 đòn đỡ, hô tên trước khi làm",
        "Ap chagi 5 lần/chân có nâng gối và co về",
        "Trả lời đủ 8 lệnh + 3 thuật ngữ đồ dùng",
        "Đứng joonbi 20 giây không nhúc nhích",
    ],
    [
        (
            "Tuần 1 — Thắt đai, chào, moa/narani",
            "Đứng moa 10 giây × 3; thắt đai trước gương",
            [
                ("18:25–18:40", "15", "Thắt đai từng em: đai ngang bụng, nút dẹt, 2 đầu bằng. Cả nhóm thắt lại 3 lần."),
                ("18:40–18:55", "15", "Moa seogi giữ 10 giây × 5. Narani seogi giữ 10 giây × 5. Sửa gót/mũi chân."),
                ("18:55–19:05", "10", "8 lệnh: mỗi lệnh làm đúng 5 lần mới sang lệnh sau. Swieo = đứng nghỉ, không ngồi."),
            ],
            [
                ("18:25–18:40", "15", "Ôn moa/narani. Xen kẽ theo lệnh thầy 12 lần."),
                ("18:40–18:55", "15", "Charyeot–kyeong-rye–joonbi theo nhịp. Sai là làm lại cả hàng."),
                ("18:55–19:05", "10", "Trò chơi lệnh đúng/sai: chỉ làm khi lệnh đúng. 6 phút. Rồi joonbi 20 giây."),
            ],
            [
                ("18:25–18:40", "15", "Đi theo hàng: sijak bước, geuman dừng joonbi, baro về chỗ."),
                ("18:40–18:55", "15", "Nhìn điểm trên tường, joonbi 20 giây × 3. Đây là bài tập trung ghi phiếu."),
                ("18:55–19:05", "10", "Thuật ngữ: dojang, dobok, sabeomnim. Mỗi em nói to + chỉ đồ vật."),
            ],
        ),
        (
            "Tuần 2 — Joonbi đều nhịp",
            "Vào joonbi 5 lần trước gương, thở ra lúc 2 tay gặp",
            [
                ("18:25–18:45", "20", "Từ narani vào kibon joonbi: 2 nắm trước hông, cách thân 1 nắm tay. 8 nhịp × 4, rồi 4 nhịp × 6."),
                ("18:45–19:05", "20", "Thầy hô lẫn lệnh. Chỉ làm lệnh đúng. Moa ↔ narani 10 lần."),
            ],
            [
                ("18:25–18:45", "20", "Joonbi theo đếm. Vai nhún = đếm lại từ 1. Cần 2 tổ sạch liên tiếp."),
                ("18:45–19:05", "20", "Nhìn tường joonbi 30 giây × 2. Hô baro. Ghi ai nhúc nhích vào phiếu tập trung."),
            ],
            [
                ("18:25–18:40", "15", "Ôn 8 lệnh + joonbi. Mỗi em làm mẫu 1 lần trước nhóm."),
                ("18:40–19:05", "25", "Kiểm từng em: thắt đai + chào + joonbi. Đạt/chưa đạt ghi sổ."),
            ],
        ),
        (
            "Tuần 3 — Ngựa tấn + đấm trung chậm",
            "Giữ juchum 10 giây × 3; chưa đấm nhanh",
            [
                ("18:25–18:45", "20", "Juchum: rộng ~2 vai, mũi song song, gối đẩy ra, gót dính. Giữ 10 giây × 6."),
                ("18:45–19:05", "20", "Đấm trung 10 lần rất chậm: nắm từ hông, xoay úp, tay kia kéo về. Đếm to."),
            ],
            [
                ("18:25–18:45", "20", "Đấm 10 lần theo đếm. Gót nhấc/vai nhún → đếm lại từ 1. Cần 2 tổ sạch."),
                ("18:45–19:05", "20", "Sửa nắm từng em (4 ngón cuộn, ngón cái ngoài, cổ tay thẳng) trong khi giữ tấn."),
            ],
            [
                ("18:25–18:45", "20", "Đấm trái 10 + phải 10. Giữ juchum 10 giây sau tổ cuối."),
                ("18:45–19:05", "20", "Thi trong nhóm: giữ tấn 15 giây + 10 đấm. Bạn cùng nhóm đếm."),
            ],
        ),
        (
            "Tuần 4 — Đấm 2 tay + hô cuối",
            "10 đấm chậm mỗi tay ở juchum",
            [
                ("18:25–18:50", "25", "Xen kẽ 2 tay, 10 đấm. Kihap nhỏ chỉ đấm thứ 10, hơi từ bụng."),
                ("18:50–19:05", "15", "10 đấm liên tục không nghỉ → đứng im 10 giây. Lần đầu làm kiểu liên tục."),
            ],
            [
                ("18:25–18:50", "25", "Mỗi em đấm trước nhóm 1 lần. Nhóm hô đếm. Sửa ngay 1 lỗi/em."),
                ("18:50–19:05", "15", "Ôn moa/narani/juchum theo tên. 2 vòng."),
            ],
            [
                ("18:25–18:45", "20", "3 tổ × 10 đấm, nghỉ 20 giây. Tổ 3 có hô."),
                ("18:45–19:05", "20", "Checklist giữa chừng: tấn + đấm. Em yếu ở lại trạm thêm 5 phút (trợ giảng)."),
            ],
        ),
        (
            "Tuần 5 — Ap seogi + ap kubi",
            "4 bước ap kubi mỗi bên; vịn ghế nếu đổ",
            [
                ("18:25–18:45", "20", "Ap seogi 8 lần/bên, giữ 5 giây. Dài ~1 bàn chân, rộng bằng vai, mũi sau ~30°."),
                ("18:45–19:05", "20", "Ap kubi 8 lần/bên, giữ 5 giây. Dài ~3 bàn chân. Gối trước trên cổ chân, không vượt mũi chân."),
            ],
            [
                ("18:25–18:50", "25", "Tiến 4 ap kubi → baro → lùi 4. Đổi chân xuất phát. 3 lượt/bên."),
                ("18:50–19:05", "15", "Đo bằng bàn chân: mỗi em tự kiểm độ dài bước với bạn cùng nhóm."),
            ],
            [
                ("18:25–18:45", "20", "Ap kubi + đấm trung tay sau 1 cái, 8 lần/bên. Đấm sau khi chân đã đặt."),
                ("18:45–19:05", "20", "Ôn juchum đấm 10. Nối ap kubi 4 bước."),
            ],
        ),
        (
            "Tuần 6 — Dwit kubi + gọi 6 tấn",
            "Người nhà hô tên, đứng đúng 6 tấn",
            [
                ("18:25–18:45", "20", "Dwit kubi 8 lần/bên, giữ 5 giây. ~70% lực chân sau. Lưng thẳng."),
                ("18:45–19:05", "20", "Đổi bên tại chỗ 6 lần: rút chân sau ngang chân trước rồi bước sang. Không nhảy."),
            ],
            [
                ("18:25–18:50", "25", "Thầy/trợ giảng gọi: moa, narani, juchum, ap, ap kubi, dwit kubi. 2 vòng. Sai tên = làm lại."),
                ("18:50–19:05", "15", "Kết bằng đấm trung 10 lần trong juchum."),
            ],
            [
                ("18:25–18:50", "25", "Trạm kiểm 6 tấn. Mỗi em 1 phiếu đạt/chưa. Em chưa đạt ở lại sửa 1 tấn yếu."),
                ("18:50–19:05", "15", "Ôn nhanh 6 tấn + 10 đấm."),
            ],
        ),
        (
            "Tuần 7 — Arae makki + hình vuông",
            "Đỡ hạ 8 lần/bên trong ap kubi",
            [
                ("18:25–18:50", "25", "Arae makki trong ap kubi, 8 lần/bên. Nắm đỡ dừng trên gối, không vung ra ngoài đùi. Mắt nhìn hướng đỡ."),
                ("18:50–19:05", "15", "Hình vuông: mỗi cạnh 1 đỡ hạ, xoay 90° chân sau. 4 vòng chậm."),
            ],
            [
                ("18:25–18:50", "25", "Hình vuông 4 vòng nữa. Giữa cạnh hô kallyeo → giữ yên đến kyesok."),
                ("18:50–19:05", "15", "Đỡ hạ + tiến đấm trung 1 cái, 6 lần/bên."),
            ],
            [
                ("18:25–18:45", "20", "Hình vuông thi trong nhóm: 2 vòng sạch."),
                ("18:45–19:05", "20", "Ôn 6 tấn 1 vòng + đấm 10."),
            ],
        ),
        (
            "Tuần 8 — Đỡ thân + đỡ thượng",
            "3 đòn đỡ, mỗi đòn 5 lần/bên",
            [
                ("18:25–18:45", "20", "Momtong bakkat makki 8/bên: cẳng tay ngoài, nắm ngang vai, khuỷu hạ."),
                ("18:45–19:05", "20", "Olgul makki 8/bên: nắm cao hơn trán, không che mắt."),
            ],
            [
                ("18:25–18:50", "25", "Hình vuông: hạ → thân → thượng → hạ. Hô tên trước khi đỡ. 4 vòng."),
                ("18:50–19:05", "15", "Thầy gọi tên đòn bất kỳ. Lớp đỡ trong ap kubi 12 lần."),
            ],
            [
                ("18:25–18:50", "25", "3 đòn liên hoàn tại chỗ 8 chu kỳ/bên."),
                ("18:50–19:05", "15", "Checklist đỡ: đạt khi hô đúng tên + dừng đúng tầm."),
            ],
        ),
        (
            "Tuần 9 — Ap chagi tách bước",
            "Vịn tường nâng gối 8 lần/chân; chưa đá cao",
            [
                ("18:25–18:50", "25", "Vịn tường/đích: nâng gối 2 giây → duỗi búng bàn chân → co → đặt. 8 lần/chân. Tầm bụng."),
                ("18:50–19:05", "15", "Bỏ vịn nếu không đổ. Tay giữ tầm má. 8 lần/chân. Gối trụ mềm."),
            ],
            [
                ("18:25–18:50", "25", "Bước tiến → đá chân sau → đặt thành ap kubi → đấm trung 1 cái. 6 lần/bên."),
                ("18:50–19:05", "15", "Chỉ đếm lần có nâng gối trước khi duỗi. Làm lại nếu đá ngang."),
            ],
            [
                ("18:25–18:45", "20", "Ap chagi vào đích mềm tầm bụng: 10 lần/chân."),
                ("18:45–19:05", "20", "Ghép hình vuông đỡ 1 vòng + đá 2 lần/chân sau mỗi vòng."),
            ],
        ),
        (
            "Tuần 10 — Đá đích + nối đỡ",
            "10 đá chậm/chân, không đích cứng",
            [
                ("18:25–18:50", "25", "Đích mềm: 10 lần/chân. Trợ giảng giữ đích. Co về mới đổi chân."),
                ("18:50–19:05", "15", "Hình vuông 3 đòn. Sau mỗi vòng đá trước 2 lần/chân."),
            ],
            [
                ("18:25–18:50", "25", "3 tổ × 8 đá/chân, nghỉ 30 giây. Đau cổ chân/gối → dừng chân đó."),
                ("18:50–19:05", "15", "Ôn đấm 10 + 6 tấn gọi tên."),
            ],
            [
                ("18:25–18:50", "25", "Thi thử bán phần: tấn + đấm + đỡ (chưa đá hết)."),
                ("18:50–19:05", "15", "Sửa 1 lỗi chung của nhóm."),
            ],
        ),
        (
            "Tuần 11 — Thi thử đúng phiếu cấp 9",
            "1 lượt bài thi; nghỉ khi mệt; không thêm đòn",
            [
                ("18:25–19:05", "40", "Chạy trọn: 6 tấn → đấm 10 → hình vuông 3 đòn → ap chagi 5/chân → 8 lệnh + thuật ngữ. Ghi đạt/chưa từng phần."),
            ],
            [
                ("18:25–19:05", "40", "Chia cụm theo lỗi (chân/tay/đá). Mỗi cụm 12 phút sửa. Rồi chạy lại phần yếu."),
            ],
            [
                ("18:25–18:50", "25", "Phiếu tháng: nhanh, mạnh, bền, dẻo, khéo, tập trung, cao, cân. HLV ký."),
                ("18:50–19:05", "15", "Phụ huynh xem 5 phút cuối nếu có: chào + 1 đá. Nhắc lịch thi Quý I + đủ 6 tuổi."),
            ],
        ),
        (
            "Tuần 12 — Chỉ sửa 2 lỗi/em",
            "Mỗi lỗi đã ghi: 10 lần đúng",
            [
                ("18:25–18:50", "25", "Mỗi võ sinh 2 lỗi tấn. Mỗi lỗi 8 lần đúng mới thôi."),
                ("18:50–19:05", "15", "Một lượt thi thử không cắt. Ghi phần còn yếu đưa sang khởi động cấp 9."),
            ],
            [
                ("18:25–19:05", "40", "Chỉ sửa đấm hoặc đỡ (không đòn mới). 8 lần đúng/lỗi."),
            ],
            [
                ("18:25–19:05", "40", "Ôn nhào lộn nhẹ + thể lực nhóm trắng. Không thêm kỹ thuật tay chân mới."),
            ],
        ),
    ],
    "Cuộn trước trên thảm có người hỗ trợ đầu/cổ; ngồi xuống → nằm nghiêng bảo vệ. Không nhào lộn cao.",
    "Chưa song đấu. Chỉ chân pháp theo hàng + đá đích.",
    "Nâng gối 20; hạ juchum 10; plank gối 15 giây; joonbi 20–30 giây.",
)

# --- Cấp 9 ---
belt(
    "C9",
    "Cấp 9 · Đai trắng 1 vạch",
    "Cấp 8",
    "Đai trắng · 2 vạch xanh dương",
    "Đủ 6 tuổi tính tại Quý II của năm dự thi.",
    [
        "5 tấn mới: yeop, beom, kkoa, hakdari + moa đổi bên",
        "Đấm trung 10 lần",
        "Hansonnal momtong bakkat makki",
        "Hansonnal mok chigi trên đích (không đánh cổ bạn)",
        "Dollyeo chagi (đá vòng cầu, mu bàn chân)",
        "Ôn ap chagi",
    ],
    [
        ("Yeop seogi", "Thân nghiêng, mũi chân trước hướng đi, gối mềm", "Hai mũi chân thẳng như ap seogi"),
        ("Beom seogi", "Lực chân sau, gót trước nhấc, tầm ngắn", "Hạ quá sâu; lưng cúi"),
        ("Kkoa seogi", "Hai gối khuỵu, đứng phần trước bàn chân", "Xoắn gối; đứng gót"),
        ("Hakdari seogi", "Gối trụ hơi khuỵu, bàn kia cạnh gối", "Khóa gối trụ"),
        ("Hansonnal bakkat makki", "Dao tay, cổ tay thẳng, tay kia trước ngực, dwit kubi", "Đỡ bằng lòng bàn; khuỷu xòe"),
        ("Mok chigi", "Chém vòng nhỏ vào đích tầm vai/cổ giả", "Chém vào cổ bạn; vung rộng mất tấn"),
        ("Dollyeo chagi", "Gối chéo lên → xoay trụ → mu bàn chân → co về", "Đá mũi chân; không xoay trụ"),
    ],
    [
        "5 tấn mới đúng khi gọi tên",
        "Đấm trung 10 không nhấc gót",
        "Đỡ dao tay 4 bước mỗi bên",
        "Chém đích 5 lần/bên có thu tay",
        "Dollyeo 5 lần/chân có xoay trụ + co về",
        "Ap chagi 5 lần/chân (không quên)",
    ],
    [
        (
            "Tuần 1 — Yeop seogi + ôn 6 tấn cũ",
            "Yeop giữ 5 giây × 5/bên",
            [
                ("18:25–18:45", "20", "Yeop seogi 8 lần/bên, giữ 5 giây. Giải thích đây là tấn ngang (oreun/wen seogi)."),
                ("18:45–19:05", "20", "Ôn 6 tấn cấp 10, mỗi tấn 3 lần. Rồi yeop 4 lần/bên."),
            ],
            [
                ("18:25–18:50", "25", "Bước sang yeop theo lệnh trái/phải, 6 lần/bên. Gót sau không nhấc trước xoay."),
                ("18:50–19:05", "15", "Đấm trung 10. Gọi tên tấn cũ + yeop."),
            ],
            [
                ("18:25–19:05", "40", "Đổi bên yeop 6 lần. Giữ yeop 10 giây/bên × 3. Thầy đẩy nhẹ vai kiểm thăng bằng."),
            ],
        ),
        (
            "Tuần 2 — Yeop vững khi bước",
            "Đổi bên yeop 6 lần",
            [
                ("18:25–18:50", "25", "Yeop tiến theo đường thẳng 6 bước/bên. Sửa mũi chân và hông."),
                ("18:50–19:05", "15", "Ôn ap kubi/dwit kubi 5 lần/bên."),
            ],
            [
                ("18:25–19:05", "40", "Trạm kiểm yeop + 6 tấn cũ. Đạt mới sang beom tuần sau."),
            ],
            [
                ("18:25–19:05", "40", "Đích: ap chagi 8/chân. Yeop seogi giữ xen giữa các tổ."),
            ],
        ),
        (
            "Tuần 3 — Beom seogi",
            "Beom 5 lần/bên; vịn tường nếu cần",
            [
                ("18:25–18:50", "25", "Beom: chân sau khuỵu, gót trước nhấc, bàn trước chạm nhẹ. 8 lần/bên giữ 5 giây. Trẻ nhỏ không hạ quá sâu."),
                ("18:50–19:05", "15", "Vào beom từ ap seogi 6 lần/bên."),
            ],
            [
                ("18:25–18:50", "25", "Giữ beom 8 giây → đấm trung 1 cái → giữ tấn. 6 lần/bên."),
                ("18:50–19:05", "15", "Ôn yeop 4 lần/bên."),
            ],
            [
                ("18:25–19:05", "40", "Beom ↔ yeop xen kẽ theo lệnh. 12 lần."),
            ],
        ),
        (
            "Tuần 4 — Kkoa seogi",
            "Kkoa 5 lần/bên có chỗ bám",
            [
                ("18:25–18:50", "25", "Kkoa: bắt chéo, 2 gối khuỵu, phần trước bàn chân. 6 lần/bên giữ 3 giây. Đau gối → dừng."),
                ("18:50–19:05", "15", "Bước chéo vào kkoa → mở ap seogi. 6 lần/bên."),
            ],
            [
                ("18:25–19:05", "40", "Ôn beom + kkoa xen kẽ, mỗi tấn 4 lần/bên."),
            ],
            [
                ("18:25–19:05", "40", "Thể lực chân: giữ beom 10 giây + kkoa 3 giây luân phiên 6 chu kỳ."),
            ],
        ),
        (
            "Tuần 5 — Hakdari ngắn",
            "Đứng 1 chân 3 giây × 5; vịn tường",
            [
                ("18:25–18:50", "25", "Hakdari giữ 3 giây × 6/chân. Đổ thì chạm mũi chân xuống, không cố."),
                ("18:50–19:05", "15", "Thêm 2 tay joonbi khi đứng hạc. 5 lần/chân."),
            ],
            [
                ("18:25–19:05", "40", "Nối yeop–beom–kkoa–hakdari. Mỗi tấn 2 lần. Cần đúng tên hơn là đẹp."),
            ],
            [
                ("18:25–19:05", "40", "Trạm kiểm 5 tấn mới. Ghi đạt/chưa."),
            ],
        ),
        (
            "Tuần 6 — Đỡ dao tay thân ngoài",
            "Đỡ dao tay 8 lần/bên; không bạn đứng sát",
            [
                ("18:25–18:50", "25", "Hansonnal momtong bakkat makki trong dwit kubi. 8 lần/bên chậm. Cạnh bàn tay, cổ tay thẳng."),
                ("18:50–19:05", "15", "Đi 1 đường 4 bước, mỗi bước 1 đỡ. 3 lượt/bên."),
            ],
            [
                ("18:25–19:05", "40", "Hình vuông: xen đỡ nắm cũ + đỡ dao tay. Hô tên. 3 vòng."),
            ],
            [
                ("18:25–19:05", "40", "Đỡ dao tay trong dwit kubi 6 + trong beom 6 mỗi bên."),
            ],
        ),
        (
            "Tuần 7 — Nối đỡ dao tay + tấn mới",
            "4 bước đỡ dao tay/bên",
            [
                ("18:25–19:05", "40", "Thầy gọi tấn rồi gọi đòn (yeop/beom/dwit + đỡ dao tay hoặc đấm). 16 lần."),
            ],
            [
                ("18:25–19:05", "40", "Ôn đấm 10 + hình vuông 3 đòn đỡ nắm tay 1 vòng + đỡ dao tay 1 vòng."),
            ],
            [
                ("18:25–19:05", "40", "Đích: đỡ dao tay rồi đấm vào đích. 8 lần/bên."),
            ],
        ),
        (
            "Tuần 8 — Chém cổ trên đích",
            "Vung dao tay chậm 8/bên; không đích = không tập chém",
            [
                ("18:25–18:50", "25", "Hansonnal mok chigi vào đích cầm tay tầm vai. 8 lần/bên. Không có cổ bạn trong tầm."),
                ("18:50–19:05", "15", "Bước ap kubi rồi chém + thu tay. 6 lần/bên."),
            ],
            [
                ("18:25–19:05", "40", "Đỡ dao tay 1 cái → chém 1 cái trên đích. 6 lần/bên."),
            ],
            [
                ("18:25–19:05", "40", "An toàn: nhắc quy tắc đích. Em không giữ đích đúng cách thì chỉ tập đỡ."),
            ],
        ),
        (
            "Tuần 9 — Dollyeo tách bước",
            "Xoay bàn chân trụ, đá chậm 8/chân; vịn tường",
            [
                ("18:25–18:50", "25", "Vịn tường: gối chéo → xoay mũi trụ → mu bàn chân → co → đặt. 8/chân. Tầm bụng."),
                ("18:50–19:05", "15", "Bỏ tường nếu trụ không đổ. Tay tầm má. 8/chân."),
            ],
            [
                ("18:25–19:05", "40", "Ap chagi 5/chân rồi dollyeo 5/chân. Không trộn 2 đá trong cùng 1 lần đếm."),
            ],
            [
                ("18:25–19:05", "40", "Đích mềm: dollyeo 8/chân. Chỉ đếm lần xoay trụ + co về."),
            ],
        ),
        (
            "Tuần 10 — Dollyeo vào đích",
            "10 dollyeo chậm/chân",
            [
                ("18:25–18:50", "25", "Đích bụng–ngực: 10/chân. 1 bước rồi đá chân sau 6/bên."),
                ("18:50–19:05", "15", "3 tổ × 6 dollyeo/chân, nghỉ 30 giây. Rồi ap 5/chân."),
            ],
            [
                ("18:25–19:05", "40", "Ghép: đỡ dao tay → chém đích → dollyeo đích. 4 chu kỳ/bên."),
            ],
            [
                ("18:25–19:05", "40", "Thi bán phần chân + tay mới."),
            ],
        ),
        (
            "Tuần 11 — Thi thử cấp 8",
            "Đọc tên 5 tấn mới + làm mỗi tấn 2 lần",
            [
                ("18:25–19:05", "40", "5 tấn mới → đấm 10 → đỡ dao tay → chém đích 5/bên → dollyeo 5/chân → ap 5/chân."),
            ],
            [
                ("18:25–19:05", "40", "Sửa phần dưới mức (thường trụ đá / gót dwit kubi)."),
            ],
            [
                ("18:25–19:05", "40", "Phiếu tháng. Chưa xếp quyền, chưa spar tự do."),
            ],
        ),
        (
            "Tuần 12 — 2 lỗi/em",
            "10 lần đúng/lỗi đã ghi",
            [
                ("18:25–19:05", "40", "Chỉ tấn hoặc chỉ tay/đá theo lỗi. 1 lượt thi thử không cắt."),
            ],
            [
                ("18:25–19:05", "40", "Ôn dollyeo chậm + đỡ dao tay. Không đòn mới."),
            ],
            [
                ("18:25–19:05", "40", "Thể lực + nhào lộn nhóm trắng–vàng nhạt."),
            ],
        ),
    ],
    "Cuộn trước có hỗ trợ; tập đứng dậy nhanh sau cuộn. Chưa cuộn sau nếu cổ yếu.",
    "Chân pháp + đá đích 1-1. Không free spar.",
    "Squat 10; giữ beom 10 giây; nâng gối 30; plank gối 20 giây.",
)

# --- Cấp 8 (Taegeuk 1) ---
belt(
    "C8",
    "Cấp 8 · Đai trắng 2 vạch",
    "Cấp 7",
    "Đai vàng (nhánh Việt An) / hoặc trắng 3 vạch",
    "Đủ 6 tuổi tính tại Quý III. Taegeuk 1 bắt đầu ở cấp này.",
    [
        "Ap kubi 10 lần; đấm trung 10, thượng 3, hạ 3",
        "Ap chagi + dollyeo chagi",
        "Taegeuk 1 (18 động tác), hô động tác cuối",
        "Phân thế bài 1",
        "Tự vệ cơ bản: lùi–đỡ–tạo khoảng cách–thoát (chưa té/khóa phức tạp)",
        "Chưa song đấu thi",
    ],
    [
        ("Taegeuk 1 đỡ trong", "Momtong an makki — mặt trong cẳng tay", "Làm thành đỡ ngoài cấp 9"),
        ("Đá trong quyền", "Co gối → duỗi → co về → đặt chân → mới đấm", "Đấm khi chân còn trên không"),
        ("Phân thế", "Đòn vào đích, tốc độ bước, đổi vai", "Đấm vào thân bạn"),
        ("Tự vệ nắm áo", "Xoay về phía ngón cái người nắm, kéo ra, bước thoát", "Bẻ khớp; vật"),
        ("Hướng mắt", "Nhìn hướng đi trước khi xoay", "Nhìn sàn; xoay rồi mới nhìn"),
    ],
    [
        "Ap kubi 10 bước đều",
        "3 tầm đấm đúng đích",
        "Taegeuk 1 thuộc, hô cuối, về đúng joonbi",
        "4 phân thế vào đích, đổi vai",
        "2 tình huống tự vệ cơ bản",
        "2 đá 5 lần/chân vào đích",
    ],
    [
        (
            "Tuần 1 — Ap kubi 10 + 3 tầm đấm",
            "Ap kubi 10/bên chậm",
            [
                ("18:25–18:45", "20", "Ap kubi tiến 10 bước/bên. Đếm to. Gối trước + gót sau."),
                ("18:45–19:05", "20", "Juchum: đấm trung 10, thượng 3, hạ 3 trên đích. Không đấm vào người."),
            ],
            [
                ("18:25–19:05", "40", "Ap chagi 8 + dollyeo 8 mỗi chân vào đích. Nghỉ 20 giây giữa chân."),
            ],
            [
                ("18:25–19:05", "40", "Trong ap kubi đấm trung tay sau 8/bên. Đích 3 tầng thầy đổi cao–thấp."),
            ],
        ),
        (
            "Tuần 2 — Ôn đá + chuẩn bị quyền",
            "Đấm thượng 3, trung 10, hạ 3",
            [
                ("18:25–18:50", "25", "Đá xen ap/dollyeo 6 mỗi loại/chân."),
                ("18:50–19:05", "15", "Xem mẫu Taegeuk 1 cả bài 2 lần (không làm). Chỉ đường di chuyển."),
            ],
            [
                ("18:25–19:05", "40", "Vẽ/dán băng keo chữ I của bài. Đi bộ không tay theo hướng 2 vòng."),
            ],
            [
                ("18:25–19:05", "40", "Ôn ap kubi 10 + 3 tầm đấm. Checklist tay chân trước khi học động tác."),
            ],
        ),
        (
            "Tuần 3 — Taegeuk 1 · Động tác 1–4",
            "1–4 chậm × 4; chưa cả bài",
            [
                ("18:25–18:35", "10", "Mẫu 2 lần. Lớp đứng nhìn."),
                ("18:35–18:55", "20", "Đếm: xoay trái ap seogi đỡ hạ; tiến đấm; xoay 180 đỡ hạ; tiến đấm. 4 lần."),
                ("18:55–19:05", "10", "Nối 1–4 không nghỉ × 4 chậm. Sửa độ dài ap kubi ở đòn đấm."),
            ],
            [
                ("18:25–19:05", "40", "Mỗi em làm 1–4 1 lần trong khi nhóm đếm. Xong về joonbi."),
            ],
            [
                ("18:25–19:05", "40", "1–4 × 6. Quên → joonbi → làm lại đoạn, không nối đại."),
            ],
        ),
        (
            "Tuần 4 — Động tác 5–8",
            "Ôn 1–8 chậm 1 lần",
            [
                ("18:25–18:50", "25", "5–6: ap kubi đỡ hạ + đấm tại chỗ. 7–8: đỡ trong thân + tiến đấm. Mẫu 2, đếm 4."),
                ("18:50–19:05", "15", "Nối 5–8 × 4. Nhấn mạnh đỡ trong ≠ đỡ ngoài cấp 9."),
            ],
            [
                ("18:25–19:05", "40", "Nối 1–8 × 2 chậm + 1 vừa."),
            ],
            [
                ("18:25–19:05", "40", "Trạm kiểm 1–8. Đạt mới học 9–12."),
            ],
        ),
        (
            "Tuần 5 — Động tác 9–12",
            "Ôn 1–12 1 lần chậm",
            [
                ("18:25–18:50", "25", "9–10 bên còn lại đỡ trong + đấm. 11–12 đỡ hạ + đấm tại chỗ. Đếm 4."),
                ("18:50–19:05", "15", "Nối 9–12 × 4. Mắt nhìn hướng mới trước xoay."),
            ],
            [
                ("18:25–19:05", "40", "Nối 1–12 × 2 chậm."),
            ],
            [
                ("18:25–19:05", "40", "Chỉ sửa hướng xoay + mắt. 1–12 × 3."),
            ],
        ),
        (
            "Tuần 6 — Động tác 13–18 + hô",
            "13–18 chậm; chú ý co chân sau đá",
            [
                ("18:25–18:50", "25", "13–16: đỡ thượng + ap chagi + đặt + đấm, 2 bên. Đá xong phải co trước khi đặt. Đếm 4."),
                ("18:50–19:05", "15", "17–18: đỡ hạ + tiến đấm + hô cuối. 6 lần riêng đoạn này."),
            ],
            [
                ("18:25–19:05", "40", "Nối 13–18 × 3. Rồi 1–18 1 lần rất chậm, được dừng nếu quên."),
            ],
            [
                ("18:25–19:05", "40", "Cả bài chậm có đếm × 2."),
            ],
        ),
        (
            "Tuần 7 — Cả bài nhịp đều",
            "2 chậm + 1 vừa; không thêm sức",
            [
                ("18:25–19:05", "40", "Cả bài × 3 chậm có đếm 18. Quên → dừng chỉ chỗ → lại từ đầu."),
            ],
            [
                ("18:25–19:05", "40", "Cả bài × 2 không đếm. Giữ khoảng cách hàng khi đá."),
            ],
            [
                ("18:25–19:05", "40", "1 lần chỉ mắt/hướng chân. 1 lần chỉ nghe hô cuối + về joonbi đúng chỗ."),
            ],
        ),
        (
            "Tuần 8 — Như đi thi",
            "1 lần: chào → joonbi → bài → baro",
            [
                ("18:25–19:05", "40", "3 lần cả bài: chậm / vừa / có hô. Sau bài chân về joonbi cùng hướng bắt đầu."),
            ],
            [
                ("18:25–19:05", "40", "Mỗi em đi 1 lần trước nhóm. Nhóm không sửa to giữa bài. Thầy ghi lỗi."),
            ],
            [
                ("18:25–19:05", "40", "Sửa 2 lỗi phổ biến nhất của sàn (thường mắt sàn / đá thấp)."),
            ],
        ),
        (
            "Tuần 9 — Phân thế 1–2",
            "Tự đi bài 1 lần; không phân thế 1 mình đánh tường",
            [
                ("18:25–18:50", "25", "Cặp đích: A đấm thân vào đích; B đỡ hạ rồi đấm trung. 6 lần, đổi vai. Tốc độ bước."),
                ("18:50–19:05", "15", "A đấm thân; B đỡ trong rồi đấm. 6 lần, đổi vai."),
            ],
            [
                ("18:25–19:05", "40", "2 tình huống × 3/bên. Dừng nếu khoảng cách sát vào người."),
            ],
            [
                ("18:25–19:05", "40", "Ôn cả bài × 1 + phân thế 1 vòng."),
            ],
        ),
        (
            "Tuần 10 — Phân thế 3–4",
            "Ôn 3 đòn đỡ × 5",
            [
                ("18:25–18:50", "25", "Đỡ thượng → ap chagi đích bụng → đặt → đấm. 6/bên."),
                ("18:50–19:05", "15", "Đỡ hạ → tiến đấm có hô → lùi 2 bước. 6 lần."),
            ],
            [
                ("18:25–19:05", "40", "4 phân thế mỗi cái × 2. Về joonbi giữa các lần."),
            ],
            [
                ("18:25–19:05", "40", "Tự vệ tình huống 1: đấm vào đích → bước chéo ra → đỡ thân → đá trước đích → lùi 2 → hô. 6 lần."),
            ],
        ),
        (
            "Tuần 11 — Tự vệ + thi thử",
            "Đi Taegeuk 1 × 1; nhắc lùi–đỡ–thoát",
            [
                ("18:25–18:45", "20", "Tình huống 2: bị nắm 1 tay áo → xoay về phía ngón cái → kéo về hông → bước ra. Không bẻ khớp. 6 lần chậm."),
                ("18:45–19:05", "20", "Thi thử căn bản: ap kubi 10, 3 tầm đấm, 2 đá 5/chân."),
            ],
            [
                ("18:25–19:05", "40", "Taegeuk 1 × 1 có hô + 4 phân thế + 2 tự vệ."),
            ],
            [
                ("18:25–19:05", "40", "Phiếu tháng. Không mở song đấu."),
            ],
        ),
        (
            "Tuần 12 — Thi thử đủ 3 phần cấp 7",
            "1 lần quyền + 2 phân thế chậm",
            [
                ("18:25–19:05", "40", "Căn bản trọn → Taegeuk 1 → phân thế → tự vệ. Ghi đạt/chưa."),
            ],
            [
                ("18:25–19:05", "40", "Chỉ sửa lỗi đã ghi. Không đòn mới."),
            ],
            [
                ("18:25–19:05", "40", "Ôn nhào lộn + thể lực. Chuẩn bị chuyển đai vàng."),
            ],
        ),
    ],
    "Cuộn trước thành thạo; bắt đầu cuộn sau trên thảm với hỗ trợ.",
    "Chân pháp + đá đích theo cặp. Chưa free spar.",
    "Burpee 5; ngồi–đứng 15; giữ plank 20–30 giây; đá đích 20 cái.",
)

# For remaining belts, use a compact but still detailed generator pattern
# to keep file size manageable while covering all requirements.


def make_weeks_poomsae(
    form_name,
    segments,
    extra_week1,
    spar_start_week=None,
    spar_note="",
    self_defense=False,
):
    """Build 12-week structure for belts with poomsae."""
    weeks = []
    # Week 1-2 foundation
    weeks.append(
        (
            f"Tuần 1 — {extra_week1[0]}",
            extra_week1[1],
            [
                ("18:25–18:50", "25", extra_week1[2]),
                ("18:50–19:05", "15", extra_week1[3]),
            ],
            [
                ("18:25–19:05", "40", extra_week1[4]),
            ],
            [
                ("18:25–19:05", "40", extra_week1[5]),
            ],
        )
    )
    weeks.append(
        (
            f"Tuần 2 — Ôn nền + xem mẫu {form_name}",
            f"Ôn kỹ thuật tuần 1; xem mẫu {form_name} 2 lần",
            [
                ("18:25–18:50", "25", f"Ôn kỹ thuật nền của cấp. {extra_week1[2][:80]}…"),
                ("18:50–19:05", "15", f"Mẫu {form_name} cả bài × 2. Chỉ đường di chuyển, chưa học hết."),
            ],
            [
                ("18:25–19:05", "40", "Đá đích đủ các đá của cấp. Checklist chân trước khi học đoạn quyền."),
            ],
            [
                ("18:25–19:05", "40", "Đi bộ theo sơ đồ bài (băng keo) không tay × 2 vòng."),
            ],
        )
    )
    # Weeks 3-6 learn segments
    for i, seg in enumerate(segments[:4]):
        w = i + 3
        prev = " → ".join(s[0] for s in segments[: i + 1])
        weeks.append(
            (
                f"Tuần {w} — {form_name} · {seg[0]}",
                seg[1],
                [
                    ("18:25–18:35", "10", f"Mẫu đoạn {seg[0]} × 2. Lớp nhìn."),
                    ("18:35–18:55", "20", f"{seg[2]} Đếm × 4."),
                    ("18:55–19:05", "10", f"Nối đoạn × 3 chậm. {seg[3]}"),
                ],
                [
                    ("18:25–19:05", "40", f"Nối từ đầu đến hết {seg[0]}: {prev}. × 2 chậm." if i else f"Mỗi em làm {seg[0]} 1 lần, nhóm đếm."),
                ],
                [
                    ("18:25–19:05", "40", f"Trạm kiểm {seg[0]}. Quên → joonbi → làm lại đoạn."),
                ],
            )
        )
    # Week 7 full form
    weeks.append(
        (
            f"Tuần 7 — Cả {form_name} nhịp đều",
            f"2 chậm + 1 vừa {form_name}",
            [
                ("18:25–19:05", "40", f"Cả bài × 3 chậm có đếm. Quên → dừng chỉ chỗ → lại từ đầu."),
            ],
            [
                ("18:25–19:05", "40", f"Cả bài × 2 không đếm. Giữ khoảng cách khi đá/chỏ."),
            ],
            [
                ("18:25–19:05", "40", "1 lần mắt/hướng. 1 lần hô cuối + về joonbi đúng chỗ."),
            ],
        )
    )
    weeks.append(
        (
            f"Tuần 8 — {form_name} như thi + 3 tốc độ",
            "Chậm / vừa / nhanh (nhanh mà quên thì dừng)",
            [
                ("18:25–19:05", "40", "3 lần cả bài đúng 3 kiểu phát lực nếu cấp đã có. Sau bài về joonbi đúng hướng."),
            ],
            [
                ("18:25–19:05", "40", "Mỗi em đi 1 lần trước nhóm. Thầy ghi lỗi, không sửa to giữa bài."),
            ],
            [
                ("18:25–19:05", "40", "Sửa 2 lỗi phổ biến nhất sàn."),
            ],
        )
    )
    # Week 9-10 bunkai / spar
    bunkai = f"Phân thế các nhịp chính của {form_name} vào đích, đổi vai, tốc độ bước."
    if self_defense:
        bunkai += " Thêm 1 tình huống tự vệ cơ bản nếu cấp yêu cầu."
    weeks.append(
        (
            f"Tuần 9 — Phân thế {form_name}",
            f"Đi cả bài × 1; phân thế chỉ trên đích",
            [
                ("18:25–19:05", "40", bunkai + " Mỗi tình huống × 6/bên."),
            ],
            [
                ("18:25–19:05", "40", "Nối 3–4 phân thế × 2 vòng. Về joonbi giữa lần."),
            ],
            [
                ("18:25–19:05", "40", spar_note if spar_start_week == 9 else "Ôn cả bài × 1 + đá đích 1 tổ."),
            ],
        )
    )
    if spar_start_week == 9:
        week10_main = spar_note
    else:
        week10_main = spar_note if spar_start_week == 10 else "Ôn phân thế + cả bài × 1."
    weeks.append(
        (
            "Tuần 10 — "
            + ("Song đấu theo giờ thi" if spar_start_week and spar_start_week <= 10 else "Củng cố phân thế + quyền"),
            "Không spar ở nhà",
            [
                ("18:25–19:05", "40", week10_main),
            ],
            [
                ("18:25–19:05", "40", "Đổi cặp nếu lệch tầm. Nhắc luật: không ôm, không đấm đầu, dừng khi kallyeo."),
            ],
            [
                ("18:25–19:05", "40", f"Phân thế 1 vòng + {form_name} 1 lần chậm để hạ nhịp."),
            ],
        )
    )
    weeks.append(
        (
            "Tuần 11 — Thi thử đủ phiếu",
            "1 lần bài thi; không thêm đòn",
            [
                ("18:25–19:05", "40", "Chạy đúng thứ tự phiếu cấp: căn bản → quyền → phân thế → (tự vệ/song đấu nếu có). Ghi đạt/chưa."),
            ],
            [
                ("18:25–19:05", "40", "Chia cụm theo lỗi. Sửa rồi chạy lại phần yếu."),
            ],
            [
                ("18:25–19:05", "40", "Phiếu tháng + đối chiếu tuổi/quý trước khi vào danh sách thi."),
            ],
        )
    )
    weeks.append(
        (
            "Tuần 12 — Chỉ sửa lỗi đã ghi",
            "10 lần đúng/lỗi",
            [
                ("18:25–19:05", "40", "Mỗi em tối đa 2 lỗi. 8 lần đúng/lỗi. 1 lượt thi thử không cắt."),
            ],
            [
                ("18:25–19:05", "40", "Không đòn mới. Ôn đoạn hay quên của quyền."),
            ],
            [
                ("18:25–19:05", "40", "Thể lực + nhào lộn + (nếu có) 1 hiệp ngắn giữ cảm giác."),
            ],
        )
    )
    return weeks


belt(
    "C7",
    "Cấp 7 · Đai vàng",
    "Cấp 6",
    "Đai xanh lá",
    "Đủ 6 tuổi tính tại Quý IV.",
    [
        "Dwit kubi 10 lần; đấm trung 10 / thượng 3 / hạ 3",
        "Ap chagi + dollyeo chagi",
        "Taegeuk 2; đòn nêu tên: eolgul jireugi (đấm thượng trên đích)",
        "Phân thế Taegeuk 2",
        "Không tự vệ, không song đấu trong phiếu thi",
    ],
    [
        ("Dwit kubi 10", "Mỗi lần cùng độ dài, lực chân sau", "Càng về sau càng đứng thẳng"),
        ("Eolgul jireugi", "Nắm ngang tầm cằm trên đích", "Đấm mặt bạn; đấm thấp thành đấm thân"),
        ("3 đá cuối bài 2", "Mỗi đá co chân + đặt rồi mới đấm", "3 đá càng lúc càng thấp"),
    ],
    [
        "Dwit kubi 10 đều",
        "Taegeuk 2 thuộc, đấm thượng chỉ trúng đích",
        "Phân thế các nhịp chính",
        "Không đưa spar vào phiếu (tập thể lực/nhào lộn riêng)",
    ],
    make_weeks_poomsae(
        "Taegeuk 2",
        [
            ("1–4", "1–4 chậm × 4", "Xoay đỡ hạ + tiến đấm trung, 2 hướng.", "Đấm trung đúng tầm ức."),
            ("5–6", "Nối 1–6 × 1", "Hai bước đỡ trong thân.", "Đỡ trong ≠ đỡ ngoài."),
            ("7–10", "Đấm thượng chỉ trên đích", "Đỡ hạ + ap chagi + eolgul jireugi 2 bên.", "Cấm đấm mặt bạn."),
            ("11–18", "Ôn đỡ thượng 8/bên", "11–14 đỡ thượng/đỡ trong; 15–18 ba đá + đấm + hô cuối.", "Đủ co gối trước mỗi đá."),
        ],
        (
            "Dwit kubi 10 chắc",
            "Dwit kubi 10/bên giữ 3 giây",
            "Dwit kubi tiến 10/bên. ~70% lực chân sau.",
            "Thầy đẩy nhẹ vai trước kiểm lực chân sau.",
            "Ôn ap kubi 10 + 3 tầm đấm + 2 đá đích.",
            "Từ dwit kubi đá ap chân trước vào đích, đặt lại tấn. 6/bên.",
        ),
        spar_start_week=None,
        spar_note="Không song đấu thi. Có thể drill chân pháp 2 phút cuối nếu còn giờ.",
        self_defense=False,
    ),
    "Cuộn trước/sau trên thảm; đứng dậy nhanh tạo khoảng cách.",
    "Drill chân pháp + đá đích. Không free spar trong giờ kỹ thuật (có thể ở block 19:05).",
    "Ngựa tấn giữ 20 giây; 10 hạ tấn; 20 đá đích; cuộn 4 lần.",
)

belt(
    "C6",
    "Cấp 6 · Đai xanh lá",
    "Cấp 5",
    "Đai xanh dương",
    "Đủ 7 tuổi tính tại Quý I. Kiểm tuổi trước khi nộp danh sách.",
    [
        "Bài tấn: narani, juchum, yeop, ap kubi, dwit kubi",
        "Ap + dollyeo + yeop chagi (đá ngang) — phiếu ghi (2) nhưng liệt kê 3 đá: dạy đủ 3",
        "Taegeuk 3; hansonnal momtong bakkat makki",
        "Phân thế bài 3; không song đấu thi",
    ],
    [
        ("Yeop chagi", "Co gối → mở hông → cạnh bàn chân/gót → mắt nhìn đích", "Đá vòng nghiêng người gọi nhầm đá ngang"),
        ("Đấm đôi bài 3", "2 đấm cùng tầm; tay trước rút khi tay sau ra", "2 đấm cùng 1 tay"),
        ("Dao tay dwit kubi", "Lực chân sau lúc đỡ → mới chuyển ap kubi đấm", "Đỡ xong ngã về trước"),
    ],
    [
        "5 tấn trong 1 bài liền",
        "3 đá 5 lần/chân vào đích",
        "Taegeuk 3 thuộc",
        "Phân thế đỡ dao tay + đấm đôi",
        "Đủ 7 tuổi theo Quý I",
    ],
    make_weeks_poomsae(
        "Taegeuk 3",
        [
            ("1–4", "1–4 chậm × 3", "Đỡ hạ + ap chagi + đấm đôi 2 hướng.", "Đấm 2 cùng tầm ức."),
            ("5–6", "Vung dao tay chậm 8/bên", "Chém dao tay tầm cổ trên đích, 2 bước.", "Không cổ bạn trong tầm."),
            ("7–10", "Dwit kubi đỡ dao tay 8/bên", "Dwit kubi đỡ dao tay → ap kubi đấm, 2 bên.", "Giữ lực chân sau lúc đỡ."),
            ("11–20", "Ôn 1–10 rồi mẫu 11–20", "Đỡ trong; đá + đấm đôi; đoạn cuối đỡ/đấm/đá + hô.", "Hô đúng động tác cuối."),
        ],
        (
            "Bài 5 tấn liền",
            "Mỗi tấn 5 lần",
            "Narani, juchum, yeop, ap kubi, dwit kubi liền mạch. Không ngồi giữa tên.",
            "Làm lại 1 tấn yếu × 6.",
            "Yeop chagi vịn tường: co gối–mở hông–duỗi cạnh bàn chân. 8/chân tầm hông.",
            "Yeop vào đích bụng 10/chân. Ap + dollyeo 5/chân.",
        ),
        spar_note="Chưa free spar thi. Block chung: chân pháp + nhào lộn.",
    ),
    "Cuộn trước/sau; thêm đứng dậy + joonbi nhanh.",
    "Đá đích theo cặp; chân pháp. Free spar nhẹ chỉ ở block chung nếu HLV cho phép, không tính phiếu.",
    "Yeop giữ tường 8/chân; 15 squat; 4 cuộn; plank 30 giây.",
)

belt(
    "C5",
    "Cấp 5 · Đai xanh dương",
    "Cấp 4",
    "Đai đỏ",
    "Đủ 7 tuổi tính tại Quý II. Lần đầu có song đấu trong phiếu: 2×30 giây.",
    [
        "3 cách phát lực: bình thường – liên tục – nhanh",
        "3 đá ap, dollyeo, yeop",
        "Taegeuk 4 (20 ĐT): đỡ dao tay có hỗ trợ + đâm ngón (pyeonsonkkeut) lực nhẹ đích mềm",
        "Phân thế bài 4",
        "Song đấu 2 hiệp × 30 giây, đủ bảo hộ",
    ],
    [
        ("Bình thường", "~4 giây/đòn, dừng sửa hình", "Chậm nhưng giật cục"),
        ("Liên tục", "Cùng tầm, không nghỉ giữa lần", "Càng về sau càng thấp"),
        ("Nhanh", "1 lần + hô + đứng im còn tấn", "Nhanh bằng cách thu nhỏ đòn"),
        ("Đâm ngón", "Ngón thẳng hàng, lực nhẹ, đích mềm", "Đâm mạnh vào người; gập ngón"),
        ("Hiệp 30 giây", "Đá giáp + che + dừng kallyeo", "Ôm; đấm đầu; đá gối; xoay người"),
    ],
    [
        "1 đòn tay + 1 đá làm đủ 3 kiểu phát lực",
        "Taegeuk 4 thuộc 3 tốc độ",
        "Đâm ngón chỉ trên đích mềm",
        "2 hiệp × 30 giây đúng luật",
        "Đủ bảo hộ: răng, ống chân, cẳng tay; giáp nếu có",
    ],
    make_weeks_poomsae(
        "Taegeuk 4",
        [
            ("1–4", "1–4 rất chậm × 4; đích mềm cho đâm ngón", "Dwit kubi đỡ dao tay có hỗ trợ; ap kubi đâm ngón dựng vào đích ức lực nhẹ.", "Đau ngón → dừng."),
            ("5–8", "Yeop 8/chân rồi xem 5–8", "Chém én đích cổ; đá trước + đấm; 2 yeop; đỡ dao tay.", "Yeop trong bài cùng tầm đích."),
            ("9–14", "Mu tay 8 vào đích", "Đỡ ngoài + đá + đỡ trong; chém én + mu tay đích cao.", "Mu tay không vào mặt."),
            ("15–20", "Cả bài 1 lần chậm", "Đỡ thân + đấm; đỡ + đấm đôi; hô ĐT 20.", "3 kiểu phát lực trên đòn 1."),
        ],
        (
            "3 kiểu phát lực trên đỡ hạ + đấm",
            "Đỡ hạ: 4 chậm + 8 liên tục + 1 nhanh/bên",
            "Arae makki 3 kiểu. Rồi đấm trung ap kubi 3 kiểu. Nhanh không được vai nhún.",
            "Ap/dollyeo/yeop mỗi đá: 4 chậm, 6 liên tục, 2 nhanh/chân.",
            "Yeop nhanh mà mất thăng bằng → quay lại chậm.",
            "Bài tấn 10 lần kiểu bình thường.",
        ),
        spar_start_week=9,
        spar_note="Mang bảo hộ. Hiệp làm quen 15 giây × 4 chỉ ap chagi vào giáp → 1 hiệp 30 giây. Cấm ôm/đấm đầu/đá gối/xoay. Tuần 10: đủ 2×30 giây, nghỉ 30 giây giữa hiệp.",
    ),
    "Cuộn + đứng dậy trong 2 giây; bắt đầu nhào nhẹ có thảm và hỗ trợ.",
    "Chính thức đưa vào phiếu: 2×30 giây. Block 19:05 ưu tiên spar có bảo hộ.",
    "3 vòng shadow 30 giây; 10 burpee; 6 cuộn; giãn hông.",
)

belt(
    "C4",
    "Cấp 4 · Đai đỏ",
    "Cấp 3",
    "Đỏ · 1 vạch đen",
    "Đủ 7 tuổi tính tại Quý III.",
    [
        "Kkoa seogi trong bài tấn; 3 kiểu phát lực",
        "4 đá: thêm dwi chagi (gót, nhìn qua vai)",
        "Taegeuk 5: búa (mejumeok), mu tay, chỏ trên đích",
        "Phân thế bài 5",
        "Song đấu 2×45 giây",
    ],
    [
        ("Dwi chagi", "Nhìn qua vai; gót thẳng sau; co về rồi đặt", "Xoay thành đá vòng; ngã dúi"),
        ("Búa", "Cạnh dưới nắm; cổ tay thẳng; đích bụng dưới", "Đập lưng nắm/cẳng tay"),
        ("Chỏ", "Cẳng tay ngang vào đích thân/lòng bàn tay", "Chỏ vào đầu bạn"),
        ("Hiệp 45 giây", "Còn đòn nửa sau hiệp; có che", "Hết sức 10 giây đầu"),
    ],
    [
        "Kkoa 10 lần/bên không đau gối",
        "Dwi chagi 5/chân vào đích gần",
        "Taegeuk 5 thuộc; búa/mu tay/chỏ chỉ trên đích",
        "2×45 giây đúng luật",
    ],
    make_weeks_poomsae(
        "Taegeuk 5",
        [
            ("Mở bài + búa", "Búa đích thấp 8/tay chậm", "Ap kubi đỡ hạ + mejumeok naeryeo chigi vào đích → đấm. 2 bên.", "Cổ tay thẳng."),
            ("Mu tay + chỏ", "Mu tay 8 + chỏ 8 chỉ đích", "Deungjumeok đích cao; palgup pyojeok đích thân. Đưa vào đoạn bài theo mẫu.", "Không vào đầu bạn."),
            ("Đoạn giữa", "Ôn đoạn đã học × 1", "HLV mẫu +4 ĐT, đếm 4; nối với đoạn búa.", "Mắt trước xoay."),
            ("Hết bài", "Chậm + vừa mỗi kiểu × 1", "Đoạn cuối theo mẫu + hô; cả bài 2 chậm 1 vừa.", "Dwi 6/chân xen giữa cho chân không nguội."),
        ],
        (
            "Kkoa + dẫn dwi chagi",
            "Kkoa 6/bên giữ 3 giây có chỗ bám",
            "Kkoa 10/bên giữ 3 giây. 2 gối mềm. Rồi mở ap kubi.",
            "3 kiểu phát lực trên 1 đòn đỡ (ở ap kubi nếu chưa giữ được kkoa).",
            "Dwi chagi vịn tường: nhìn qua vai → gối → gót sau → co → đặt. 8/chân. Không xoay thành vòng.",
            "Dwi đích gần tầm bụng 10/chân. Đích xa dễ ngã dúi.",
        ),
        spar_start_week=9,
        spar_note="Đích 5 phút đủ 4 đá. Hiệp 20 giây rồi 45 giây. Tuần 10: 2×45 giây, nghỉ 45 giây. Phải có đá thân + che.",
    ),
    "Nhào trước/sau có kiểm soát; đứng dậy tạo khoảng cách (làm nền tự vệ đẳng sau).",
    "2×45 giây trong phiếu. Block chung ưu tiên spar + nhào.",
    "Dwi 10/chân chậm; 2 hiệp shadow 45 giây; 6 nhào; giãn thắt lưng.",
)

belt(
    "C3",
    "Cấp 3 · Đỏ 1 vạch đen",
    "Cấp 2",
    "Đỏ · 2 vạch đen",
    "Đủ 7 tuổi tính tại Quý IV.",
    [
        "Beom seogi; 3 kiểu phát lực; 4 đá có dwi",
        "Taegeuk 6: sonnal bitureo makki + batangson momtong makki",
        "Phân thế bài 6",
        "Song đấu 2×1 phút",
    ],
    [
        ("Beom seogi", "Gót trước nhấc; lực chân sau; thân thẳng", "Thành ap seogi vì bước quá dài"),
        ("Đỡ dao tay vặn", "Lòng bàn ngửa cuối; 1 nhịp hông", "Chỉ vẫy tay; hông không xoay"),
        ("Đỡ lòng bàn tay", "Gót bàn tay; ngón mở; tầm thân", "Đỡ bằng ngón hoặc nắm đấm"),
        ("Hiệp 1 phút", "Có phòng thủ + phản công; nghỉ đủ giữa hiệp", "Đứng ôm; quay lưng"),
    ],
    [
        "Beom 10/bên",
        "2 đòn đỡ mới đúng trên đích",
        "Taegeuk 6 thuộc 3 tốc độ",
        "2×60 giây: có thủ và phản công",
    ],
    make_weeks_poomsae(
        "Taegeuk 6",
        [
            ("Đỡ dao tay vặn", "Bitureo makki 8/bên chậm", "Dao tay vặn, lòng ngửa cuối, hông 1 nhịp, thường dwit kubi. Mẫu 2, làm 8/bên.", "Đưa vào đoạn mở bài theo mẫu × 4."),
            ("Batangson", "Đỡ lòng bàn 8/bên đích mềm", "Gót bàn tay đỡ thân, ngón mở, khuỷu mềm. 8/bên lực vừa.", "Xen 2 đòn mới theo tên thầy × 10."),
            ("Nối đoạn", "Từ đầu đến đoạn đang học × 1", "Thêm +4 ĐT đếm 4; thêm +4 nữa.", "Nối từ joonbi × 2 chậm."),
            ("Hết bài + hô", "Cả bài × 1 chậm", "Đoạn cuối mẫu × 4; hô chỉ động tác cuối.", "1 lần Taegeuk 5 để khỏi quên."),
        ],
        (
            "Beom + 4 đá 3 kiểu",
            "Beom 10/bên giữ 3 giây",
            "Beom 10/bên. Không hạ thấp hơn mức giữ được lưng. Từ beom đấm trung 8/bên.",
            "3 kiểu phát lực trên đấm đó.",
            "Ap: chậm/liên tục 6/nhanh 2 mỗi chân. Dollyeo + yeop cùng cách (chia buổi).",
            "Dwi chỉ chậm + vừa 6/chân. Nhanh chỉ khi giữ được thăng bằng.",
        ),
        spar_start_week=9,
        spar_note="Đích 5 phút đủ 4 đá. Hiệp 40 giây rồi 60 giây. Tuần 10: 2×60 giây, nghỉ 60 giây. Mỗi hiệp phải có phòng thủ.",
    ),
    "Nhào trước/sau + đứng dậy thoát; không ep trẻ nhào cao.",
    "2×1 phút. Ưu tiên chất lượng luật hơn số hiệp.",
    "2 shadow 60 giây; 8 nhào; core 30 giây; giãn.",
)

belt(
    "C2",
    "Cấp 2 · Đỏ 2 vạch đen",
    "Cấp 1",
    "Đỏ · 3 vạch đen",
    "Đủ 8 tuổi tính tại Quý I và đủ 3 tháng ở cấp 2.",
    [
        "Hakdari seogi; 3 kiểu phát lực; 4 đá",
        "Taegeuk 7: kawi makki + mureup chigi (gối chỉ đích thân)",
        "Phân thế bài 7",
        "Song đấu 2×1 phút, hơn 1 loại đá trong hiệp",
    ],
    [
        ("Hakdari", "Gối trụ hơi khuỵu; đủ số giây", "Khóa gối; đặt chân sớm mất đòn tay"),
        ("Kawi makki", "2 tay dừng cùng lúc: 1 hạ 1 thượng", "Làm thành 2 đòn nối tiếp"),
        ("Mureup chigi", "Gối lên đích bụng; đặt chân có kiểm soát", "Lao người; gối vào đầu"),
        ("Spar cấp 1", "Trong hiệp ≥ 2 loại đá + che", "Chỉ 1 đá suốt 2 hiệp"),
    ],
    [
        "Hakdari 5 giây/chân × 4",
        "Kawi 2 tay cùng nhịp",
        "Gối chỉ vào đích thân",
        "Taegeuk 7 thuộc",
        "2×60 giây đa dạng đá",
        "Đủ 8 tuổi Quý I + đủ 3 tháng cấp 2 trước khi nộp thi",
    ],
    make_weeks_poomsae(
        "Taegeuk 7",
        [
            ("Kawi makki", "Đỡ kéo 8/bên chậm", "1 tay đỡ hạ + 1 tay đỡ thượng cùng nhịp, hông xoay 1 lần. 8/bên.", "Chỉ đếm lần 2 tay cùng dừng."),
            ("Mureup chigi", "Nâng gối 10/chân chưa lao người", "Gối lên đích bụng. 8/chân. Không gối đầu/người không đích. 1 bước rồi gối 6/chân.", "Đỡ kéo 1 + gối 1 × 6/bên."),
            ("Đoạn quyền", "Đoạn đỡ kéo + gối × 4 chậm", "Mẫu đoạn kawi đếm 4; mẫu đoạn gối đếm 4; nối 2 đoạn × 3.", "Gối trong bài cùng tầm đích."),
            ("Hết bài", "Cả bài × 1 chậm; dừng nếu mất thăng bằng", "Cả bài 2 chậm (hạc giữ ngắn đều nhịp, không đặt chân sớm mất đòn) + 1 vừa.", "1 lần Taegeuk 6."),
        ],
        (
            "Hakdari tăng giây + 4 đá",
            "Mỗi chân 5 giây × 5; vịn nếu đổ",
            "Hakdari 3 giây × 5 rồi 5 giây × 4/chân. Gối trụ khuỵu. Đổ → chạm chân xuống.",
            "2 tay làm đỡ khi đứng được. 4/chân. Chưa vững thì đòn tay ở ap kubi.",
            "Hạc → đặt → ap chagi 6/chân. Dollyeo + yeop 6 sau hạc 3 giây.",
            "Dwi 6/chân không bắt đầu từ hạc. Cần 2 chân đặt trước khi nhìn qua vai.",
        ),
        spar_start_week=9,
        spar_note="Đích đủ 4 đá × 4. 2×60 giây: thầy đếm loại đá; chỉ 1 loại → hiệp sau phải thêm loại. Tuần 10 đổi cặp, vẫn cấm ôm/đấm đầu/đá gối.",
    ),
    "Nhào trước/sau thành thạo; kết hợp đứng dậy + tạo khoảng cách (nền đẳng).",
    "2×1 phút đa dạng đá. Block chung = spar có trọng tài hô.",
    "Hakdari 5 giây × 6; 2×60 shadow; 8 nhào; giãn hông dài.",
)


def build():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2)
        section.right_margin = Cm(2)

    add_p(
        doc,
        "CLB TAEKWONDO VIỆT AN",
        bold=True,
        size=14,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    add_p(
        doc,
        "GIÁO ÁN THĂNG CẤP ĐAI MÀU",
        bold=True,
        size=16,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    add_p(
        doc,
        "Cấp 10 → Cấp 1 (theo QĐ 152/2025/QĐ-VTF)",
        bold=True,
        size=12,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    add_p(
        doc,
        "Bản để HLV dạy trên sàn + phụ huynh/võ sinh theo dõi. File Word để chỉnh sửa.",
        size=11,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    add_p(
        doc,
        "Giả định đã chốt: 3 buổi/tuần × 90 phút; 18:00 khởi động chung đến ~18:25 (có thể kéo 18:30); 1 sàn nhiều đai rồi chia nhóm; tuổi chính 6–15, dưới 6 tập nội dung cấp 10; nhánh đai vàng–xanh lá–xanh dương–đỏ như app; Taegeuk 1 dạy từ cấp 8 thi cấp 7; ưu tiên thi cấp + thể lực + nhào lộn + song đấu; đủ đích/bảo hộ cơ bản.",
        size=10,
    )

    add_h(doc, "1. Cách dùng giáo án", 1)
    add_bullets(
        doc,
        [
            "HLV: mang file này ra sàn. Phần “Giờ” là lịch mẫu 18:00–19:30. Có thể dời nếu đổi khung giờ, giữ đúng số phút.",
            "Phụ huynh/võ sinh: đọc mục tiêu tuần + việc ở nhà + checklist trước kỳ thi.",
            "Tuần 1–10 học mới. Tuần 11 thi thử đúng phiếu. Tuần 12 chỉ sửa lỗi — không thêm đòn.",
            "Điểm đậu theo QĐ 152: trung bình ≥ 70; vẫn rớt nếu 2/3 giám khảo cho dưới 70.",
            "Chỗ in nghiêng hoặc ghi “HLV chỉnh”: cần bạn sửa cho khớp thói quen Việt An.",
        ],
    )

    add_h(doc, "2. Khung 1 buổi 90 phút (cả sàn)", 1)
    add_table(
        doc,
        ["Giờ", "Phút", "Nội dung", "Ai tham gia"],
        [
            ["18:00–18:05", "5", "Xếp hàng theo đai (cao → thấp hoặc theo nhóm tuổi), chào cờ, chào sabeomnim, điểm danh", "Cả sàn"],
            ["18:05–18:25", "20", "Khởi động chung (có thể kéo đến 18:30 = 25 phút). Xem mục 3.", "Cả sàn"],
            ["18:25–19:05", "40", "Chia nhóm đai / trạm. Kỹ thuật + quyền + phân thế theo giáo án cấp.", "Theo nhóm"],
            ["19:05–19:20", "15", "Thể lực + nhào lộn + song đấu/drill theo tầng cấp (mục 5).", "Cả sàn, chia tầng"],
            ["19:20–19:30", "10", "Giãn tĩnh, nhắc 1 việc ở nhà, chào, dặn lịch thi/phiếu tháng nếu đến hạn.", "Cả sàn"],
        ],
    )
    add_p(
        doc,
        "Nếu khởi động kéo đến 18:30: cắt block kỹ thuật còn 35 phút (18:30–19:05) hoặc cắt 5 phút block 19:05. Không cắt phần chào và giãn.",
        size=10,
    )

    add_h(doc, "3. Khởi động chung 18:05–18:25 (mẫu)", 1)
    add_table(
        doc,
        ["Phút", "Việc"],
        [
            ["0–2", "Chạy quanh sàn / high knees / butt kicks nhẹ"],
            ["2–6", "Xoay cổ chân, gối, hông, vai, cổ tay — 8 vòng mỗi phía"],
            ["6–10", "Vung chân trước–sau và ngang 8 lần/chân; xoay hông"],
            ["10–14", "Đá lỏng ap chagi + dollyeo tầm thấp 10/chân (cấp chưa học dollyeo thì chỉ ap)"],
            ["14–18", "Di chuyển 4 hướng: tiến–lùi–sang trái–phải theo hàng"],
            ["18–20", "Uống nước 30–45 giây; HLV phân nhóm/trạm và giao trợ giảng"],
        ],
    )
    add_p(doc, "Chưa ngồi giữ giãn sâu khi cơ còn nguội. Giãn tĩnh để phút 19:20.", size=10)

    add_h(doc, "4. Chia nhóm trên 1 sàn", 1)
    add_p(doc, "Gợi ý 4 trạm (điều chỉnh theo số trợ giảng):", bold=True)
    add_table(
        doc,
        ["Trạm", "Đai", "Ưu tiên trong 40 phút"],
        [
            ["A", "Cấp 10 (+ dưới 6 tuổi) và Cấp 9", "Tấn, đấm, đỡ, đá đích, thuật ngữ — chưa quyền hoặc quyền chưa thi"],
            ["B", "Cấp 8 và Cấp 7 (vàng)", "Taegeuk 1–2, phân thế, tự vệ cơ bản (cấp 8)"],
            ["C", "Cấp 6 (xanh lá) và Cấp 5 (xanh dương)", "Taegeuk 3–4, yeop chagi, 3 kiểu phát lực, spar 30 giây (cấp 5)"],
            ["D", "Cấp 4–1 (đỏ ± vạch)", "Taegeuk 5–7, dwi chagi, spar 45–60 giây, phân thế nâng cao"],
        ],
    )
    add_bullets(
        doc,
        [
            "1 HLV chính: điều hành khởi động + block 19:05 + quay vòng sửa từng trạm.",
            "Trợ giảng / đai cao: đứng cố định 1 trạm trong 40 phút kỹ thuật.",
            "Nếu thiếu người: gộp A+B và C+D; dùng chuông 10 phút xoay đề bài.",
            "Dưới 6 tuổi luôn vào trạm A, nội dung cấp 10, không vào danh sách thi.",
        ],
    )

    add_h(doc, "5. Block 19:05–19:20 — Thể lực / Nhào lộn / Song đấu", 1)
    add_p(doc, "Xoay 3 tuần một chủ đề chính, tuần nào cũng có 3–5 phút thể lực ngắn:", bold=True)
    add_table(
        doc,
        ["Tầng", "Thể lực", "Nhào lộn", "Song đấu / drill"],
        [
            ["Cấp 10–9", "Nâng gối, hạ juchum, plank gối, joonbi im", "Cuộn trước có hỗ trợ", "Chân pháp hàng + đá đích 1-1"],
            ["Cấp 8–7", "Burpee ít cái, ngồi–đứng, đá đích", "Cuộn trước; cuộn sau có hỗ trợ", "Đá đích theo cặp; chưa free spar phiếu"],
            ["Cấp 6–5", "Shadow 30 giây, squat, plank", "Cuộn + đứng dậy 2 giây", "Cấp 5: spar bảo hộ đúng giờ thi"],
            ["Cấp 4–1", "Shadow đủ giờ hiệp, core, giãn hông", "Nhào trước/sau kiểm soát trên thảm", "Spar đúng 45–60 giây + luật"],
        ],
    )
    add_p(
        doc,
        "An toàn nhào lộn: luôn có thảm; không ép trẻ sợ; không nhào không hỗ trợ với nhóm mới; đau cổ/lưng → dừng ngay.",
        size=10,
    )

    add_h(doc, "6. Lịch quý thi & nhánh đai Việt An", 1)
    add_table(
        doc,
        ["Đang đeo", "Thi lên", "Đai khi đậu (Việt An)", "Thời gian", "Tuổi / quý tính"],
        [
            ["Cấp 10 (trắng)", "Cấp 9", "Trắng 1 vạch xanh dương", "3 tháng", "≥6 · Quý I"],
            ["Cấp 9", "Cấp 8", "Trắng 2 vạch", "3 tháng", "≥6 · Quý II"],
            ["Cấp 8", "Cấp 7", "Vàng", "3 tháng", "≥6 · Quý III"],
            ["Cấp 7 vàng", "Cấp 6", "Xanh lá", "3 tháng", "≥6 · Quý IV"],
            ["Cấp 6 xanh lá", "Cấp 5", "Xanh dương", "3 tháng", "≥7 · Quý I"],
            ["Cấp 5 xanh dương", "Cấp 4", "Đỏ", "3 tháng", "≥7 · Quý II"],
            ["Cấp 4 đỏ", "Cấp 3", "Đỏ 1 vạch đen", "3 tháng", "≥7 · Quý III"],
            ["Cấp 3", "Cấp 2", "Đỏ 2 vạch đen", "3 tháng", "≥7 · Quý IV"],
            ["Cấp 2", "Cấp 1", "Đỏ 3 vạch đen", "3 tháng", "≥8 · Quý I"],
        ],
    )
    add_p(
        doc,
        "Kỳ thi CLB tối đa 4 lần/năm: 15/1–31/3; 15/4–30/6; 15/7–30/9; 15/10–31/12. Đăng ký online ≥ 7 ngày. Ap chagi trong văn bản từng chú Side Kick — dạy là đá trước; đá ngang = yeop chagi.",
        size=10,
    )

    add_h(doc, "7. Giáo án chi tiết từng cấp", 1)

    for b in BELTS:
        doc.add_page_break()
        add_h(doc, f"{b['holding']} → tập để thi {b['next']}", 1)
        add_p(doc, f"Khi đậu đeo: {b['color']}", bold=True)
        add_p(doc, f"Tuổi / quý: {b['age']}")
        add_p(doc, f"Nhào lộn: {b['tumbling']}", size=10)
        add_p(doc, f"Song đấu: {b['sparring']}", size=10)
        add_p(doc, f"Thể lực gợi ý: {b['fitness']}", size=10)

        add_h(doc, "Thứ tự phiếu thi", 2)
        add_bullets(doc, b["exam"])

        add_h(doc, "Chuẩn đòn — đúng / hay sai", 2)
        add_table(doc, ["Đòn", "Đúng", "Hay sai"], b["tech"])

        add_h(doc, "Checklist trước khi nộp thi (đạt hết mới ghi danh)", 2)
        add_bullets(doc, [f"☐ {c}" for c in b["check"]])

        add_h(doc, "12 tuần × 3 buổi (phần nhóm 18:25–19:05)", 2)
        add_p(
            doc,
            "Trước đó luôn làm khung chào + khởi động chung. Sau đó luôn có block 19:05 và giãn 19:20. Dưới đây chỉ viết phút kỹ thuật theo nhóm.",
            size=10,
        )
        for week in b["weeks"]:
            title, home, day_a, day_b, day_c = week
            add_h(doc, title, 3)
            add_p(doc, f"Ở nhà tuần này: {home}", size=10)
            day_block(doc, "Ngày A", day_a)
            day_block(doc, "Ngày B", day_b)
            day_block(doc, "Ngày C", day_c)

    doc.add_page_break()
    add_h(doc, "8. Mẫu phiếu tháng (in riêng hoặc chép sổ)", 1)
    add_table(
        doc,
        ["Hạng mục", "Ghi chú / điểm"],
        [
            ["Họ tên / mã VS", ""],
            ["Cấp đai / ngày", ""],
            ["Nhanh", ""],
            ["Mạnh", ""],
            ["Bền", ""],
            ["Mềm dẻo", ""],
            ["Khéo léo", ""],
            ["Tập trung (joonbi im)", ""],
            ["Chiều cao / cân nặng", ""],
            ["Chữ ký HLV", ""],
            ["Phụ huynh đã xem", "☐"],
        ],
    )

    add_h(doc, "9. Việc cần bạn sửa giúp (để đạt ~99%)", 1)
    add_bullets(
        doc,
        [
            "Giờ vào lớp cố định có đúng 18:00–19:30 không, hay có ca khác?",
            "Trợ giảng thường có mấy người/buổi? Có nên gộp trạm khác không?",
            "Nhào lộn: CLB đang dạy đến mức nào (chỉ cuộn / đã nhào / có mô hình đẳng)?",
            "Song đấu trẻ 6–8 tuổi: tiếp xúc nhẹ đến đâu (chỉ giáp thân / có mũ)?",
            "Phiếu tháng đang dùng mẫu sẵn chưa — nếu có, gửi mình thay mục 8.",
            "Tên gọi đòn trên sàn Việt An (ví dụ apcha / tôlô…) nếu khác romanization trong file.",
        ],
    )
    add_p(
        doc,
        "Nguồn nội dung thi: QĐ 152/2025/QĐ-VTF. Cách chia phút/tuần là giáo án vận hành Việt An — không phải phụ lục của Liên đoàn. Video mẫu quyền: kênh YouTube Kukkiwon (Taegeuk 1–8).",
        size=9,
    )

    doc.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
