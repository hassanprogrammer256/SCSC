import random
import shutil
from datetime import timedelta
from decimal import Decimal
from io import BytesIO

import docx
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User, UserActionLog
from activities.models import Activity, ActivityAssignment
from announcements.models import Announcement, Notification
from announcements.services.delivery import send_announcement
from assessments.models import AssessmentReport, ExternalSearchQuota, Mark, PlagiarismReport, Submission
from assessments.services.plagiarism import run_plagiarism_check
from courses.models import Course, LandGroup
from personnel.models import DirectingStaffProfile, OfficerProfile
from scheduling.models import AssessmentSchedule, TimetableEntry

TEST_PASSWORD = "Passw0rd!"

COUNTRIES = [
    ("UPDF", "Uganda"),
    ("KDF", "Kenya"),
    ("RDF", "Rwanda"),
    ("BDF", "Burundi"),
    ("SSPDF", "South Sudan"),
    ("TPDF", "Tanzania"),
]

FIRST_NAMES = [
    "Peter", "James", "Daniel", "Samuel", "Joseph", "David", "Emmanuel", "Robert", "Michael", "John",
    "Charles", "Richard", "Francis", "Patrick", "Vincent", "Moses", "Isaac", "Andrew", "Simon", "Paul",
    "Herbert", "Fred", "Geoffrey", "Ronald", "Denis", "Ibrahim", "Yusuf", "Martin", "Stephen", "Edwin",
    "Grace", "Aisha", "Sarah", "Ruth", "Mary", "Josephine", "Sylvia", "Patience", "Betty", "Rose",
    "Florence", "Joan", "Christine", "Immaculate", "Harriet", "Judith", "Winnie", "Doreen", "Brenda", "Diana",
    "Esther", "Faith", "Gloria", "Irene", "Claudine", "Nyandeng", "Huguette", "Farida", "Desire", "Ruth",
]

LAST_NAMES = [
    "Okello", "Byaruhanga", "Nakato", "Mwangi", "Kiptoo", "Uwase", "Habimana", "Nkurunziza", "Ndayishimiye", "Mrema",
    "Massawe", "Ssemakula", "Achieng", "Kabongo", "Wani", "Lokosang", "Otieno", "Wanjiru", "Nshuti", "Bizimana",
    "Niyonzima", "Odongo", "Apio", "Nabirye", "Kyeyune", "Tumusiime", "Kwizera", "Habyarimana", "Gasana", "Mutebi",
    "Ntambara", "Rugamba", "Kagoro", "Achola", "Nantongo", "Ochieng", "Kariuki", "Njoroge", "Deng", "Akol",
]

OFFICER_RANKS = ["Captain", "Captain", "Major", "Major", "Major", "Lt. Colonel"]
DS_RANKS = ["Major", "Lt. Colonel", "Lt. Colonel", "Colonel"]

ACTIVITY_NAMES = [
    "Bush Survival", "Tactical Exercise Without Troops", "Map Reading & Land Navigation", "Leadership Seminar",
    "Physical Fitness Assessment", "Counter-Insurgency Operations", "Logistics Planning", "International Humanitarian Law",
    "Peace Support Operations", "Staff Duties", "Communications & Signals", "Combined Arms Tactics",
    "Strategic Studies", "Military Law", "Civil-Military Relations", "Urban Warfare Tactics",
    "Amphibious Operations", "Airborne Operations Familiarisation", "Cyber Warfare Awareness", "Intelligence Analysis",
    "Field Engineering", "Convoy Operations", "Negotiation & Mediation", "Crisis Management",
    "Defence Economics", "Regional Security Studies", "Ethics in Warfare", "Command Post Exercise",
    "Battle Inoculation", "Written Staff Paper",
]

ROOMS = [
    "Lecture Hall A", "Lecture Hall B", "Seminar Room 1", "Seminar Room 2",
    "Seminar Room 3", "Field Training Ground", "Auditorium", "Map Room",
]

PARAGRAPH_TEMPLATES = [
    "Survival in hostile terrain depends on discipline, situational awareness, and the ability to improvise shelter and water sourcing under pressure. Officers must prioritise concealment over comfort during the first critical hours. A well-rehearsed rally-point procedure prevents small unit fragmentation when contact is broken unexpectedly.",
    "Effective staff planning begins with a clear restatement of the commander's intent before any course of action is developed. Every option must be tested against time, resources, and the enemy's most likely reaction. Written orders should never leave room for ambiguous interpretation at the executing unit level.",
    "Logistics sustains every other function of a modern military operation, from forward resupply to casualty evacuation timelines. A single point of failure in the supply chain can stall an otherwise sound tactical plan within hours. Planners must always build redundancy into fuel and ammunition resupply routes.",
    "International humanitarian law places clear obligations on commanders regarding the treatment of civilians and captured personnel during active operations. Ignorance of these obligations is never an acceptable defence before a military tribunal. Every officer bears personal responsibility for the conduct of soldiers under their direct command.",
    "Peace support operations demand a different mindset from conventional warfighting, favouring restraint, negotiation, and impartiality over decisive force. Troops must be trained to de-escalate volatile crowd situations without resorting immediately to lethal options. Community engagement often achieves more than a show of force ever could.",
    "Combined arms tactics require infantry, armour, and artillery elements to operate as a single synchronised system rather than in isolation. Poor coordination between these arms has historically been the leading cause of preventable casualties in mechanised warfare. Rehearsed communication protocols reduce the risk of fratricide significantly.",
    "Strategic studies examine how national interests, economic capacity, and alliance structures shape a country's long-term security posture. A staff officer who understands the strategic level can better translate national objectives into coherent operational plans. Regional security cannot be assessed in isolation from wider global power dynamics.",
    "Urban warfare compresses engagement distances and multiplies the risk to civilians caught within the battle space. Clearing operations must balance speed against the certainty of room-by-room verification. Command and control becomes significantly harder once units are fragmented across multiple buildings and floors.",
    "Field engineering tasks range from rapid obstacle breaching to the construction of defensive positions under time pressure. Engineers must assess soil conditions and available materials before committing to a construction method. A poorly sited defensive position can negate months of otherwise sound tactical preparation.",
    "Crisis management at the staff level requires rapid, disciplined decision-making even when the available information is incomplete or contradictory. Officers must resist the urge to wait for perfect information before acting on a developing situation. A timely, reasonable decision consistently outperforms a delayed, theoretically optimal one.",
    "Military law governs the conduct of armed forces both on and off the battlefield, extending well beyond simple rules of engagement. Commanders who fail to enforce discipline risk undermining unit cohesion and public trust in the institution. Every officer must be able to explain the legal basis for their orders.",
    "Intelligence analysis transforms raw, fragmented reporting into an actionable picture of enemy capability and intent for the commander. Analysts must guard against confirmation bias when new reporting appears to support an existing assumption. A single unverified source should never drive a major operational decision alone.",
    "Convoy operations remain one of the highest-risk activities conducted by ground forces in an active theatre of operations. Route selection, vehicle spacing, and pre-positioned quick reaction forces all reduce exposure to ambush. Drivers and commanders alike must rehearse actions-on-contact drills until they become instinctive.",
    "Negotiation and mediation skills are increasingly essential for officers operating in complex, multi-actor environments alongside civilian authorities. Active listening often reveals underlying interests that a purely positional negotiating stance would never surface. Building long-term trust matters more than winning any single exchange.",
    "Command post exercises test a staff's ability to process information and issue timely orders without the friction of a live deployment. Realistic injects should stress communication systems, casualty reporting, and logistics simultaneously. A staff that performs well under simulated pressure is far better prepared for real operations.",
    "Battle inoculation exposes officers to the sounds, confusion, and physical demands of combat in a controlled but realistic environment. The goal is not to eliminate fear but to ensure sound decision-making persists despite it. Repeated, progressively realistic exposure builds the confidence needed for real engagements.",
    "Regional security studies examine how border disputes, resource competition, and ethnic tension interact to threaten stability across neighbouring states. A staff college graduate should be able to brief a regional threat assessment with appropriate nuance. Oversimplified narratives rarely survive contact with the actual complexity on the ground.",
    "Civil-military relations shape how armed forces are perceived by the population they are sworn to protect and serve. A professional military remains accountable to lawful civilian authority even during periods of internal political tension. Officers must understand this boundary clearly to avoid institutional overreach.",
]

DUPLICATE_TEXT = (
    "Survival in hostile terrain depends on discipline, situational awareness, and the ability to improvise "
    "shelter and water sourcing under pressure. Officers must prioritise concealment over comfort during the "
    "first critical hours of any incident. A well-rehearsed rally-point procedure prevents small unit "
    "fragmentation when contact with the main body is broken unexpectedly."
)


def make_docx_bytes(paragraphs: list[str]) -> bytes:
    document = docx.Document()
    for paragraph in paragraphs:
        document.add_paragraph(paragraph)
    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()


class Command(BaseCommand):
    help = (
        "Flushes all course/personnel/academic data and seeds a large, realistic "
        "dataset covering every feature in the system. Every seeded account shares "
        "the same test password (see TEST_PASSWORD) rather than a random one-time "
        "password, since the whole point is to be able to log in and test freely."
    )

    def add_arguments(self, parser):
        parser.add_argument("--officers", type=int, default=100)
        parser.add_argument("--directing-staff", type=int, default=20)
        parser.add_argument("--activities", type=int, default=30)

    def handle(self, *args, **options):
        random.seed(42)  # reproducible dataset across re-runs
        n_officers = options["officers"]
        n_ds = options["directing_staff"]
        n_activities = options["activities"]

        with transaction.atomic():
            self._flush()
            self.stdout.write("Flushed existing data.")

            course, red, blue = self._create_course("2026/27", 2026)
            admin = self._create_admin()
            officers = self._create_officers(course, red, blue, n_officers)
            ds_list = self._create_directing_staff(course, n_ds)
            activities = self._create_activities(course, n_activities)
            self._create_assignments(activities, ds_list, red, blue)
            self._create_timetable(activities, red, blue)
            schedules = self._create_assessment_schedules(activities)
            self._create_submissions_marks_plagiarism(course, schedules, officers, ds_list, red, blue)
            self._create_announcements(admin, ds_list, course, activities)
            self._create_archived_course()

        self.stdout.write(self.style.SUCCESS("\nSeed complete."))
        self.stdout.write(self.style.SUCCESS(f"Every account's password: {TEST_PASSWORD}"))
        self.stdout.write(self.style.SUCCESS(f"Admin: {admin.army_number}"))
        self.stdout.write(self.style.SUCCESS(f"{n_officers} officers, {n_ds} directing staff, {n_activities} activities on course 2026/27."))
        self.stdout.write(self.style.SUCCESS("A second, already-archived course (2024/25) was also seeded to test Archive."))

    # ------------------------------------------------------------------
    # Flush

    def _flush(self):
        for model in [
            Notification, Announcement, AssessmentReport, PlagiarismReport, ExternalSearchQuota,
            Mark, Submission, TimetableEntry, AssessmentSchedule, ActivityAssignment, Activity,
            OfficerProfile, DirectingStaffProfile, LandGroup, Course, UserActionLog, User,
        ]:
            model.objects.all().delete()

        # Local dev media only — Cloudinary (prod) isn't touched by this command.
        for subdir in ("submissions", "profiles"):
            path = settings.MEDIA_ROOT / subdir if hasattr(settings, "MEDIA_ROOT") else None
            if path and path.exists():
                shutil.rmtree(path)

    # ------------------------------------------------------------------
    # Course / people

    def _create_course(self, code, start_year):
        course = Course.objects.create(code=code, start_year=start_year, status=Course.Status.ACTIVE)
        red = LandGroup.objects.create(course=course, name=LandGroup.Name.RED)
        blue = LandGroup.objects.create(course=course, name=LandGroup.Name.BLUE)
        return course, red, blue

    def _make_user(self, army_number, role, rank, full_name, country, avatar_bytes=None):
        user = User(army_number=army_number, role=role, rank=rank, full_name=full_name, country=country, must_change_password=False, is_active=True)
        user.set_password(TEST_PASSWORD)
        user.save()
        if avatar_bytes:
            user.avatar.save(f"{user.id}.jpg", ContentFile(avatar_bytes), save=True)
        return user

    def _create_admin(self):
        return self._make_user("UPDF-A1002", User.Role.ADMIN, "Colonel", "Grace Nakato", "Uganda")

    def _create_officers(self, course, red, blue, count, number_offset=1000):
        avatar_bytes = self._load_avatar_bytes()
        officers = []
        for i in range(count):
            prefix, country = COUNTRIES[i % len(COUNTRIES)]
            full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            rank = random.choice(OFFICER_RANKS)
            land_group = red if i < count // 2 else blue
            user = self._make_user(
                f"{prefix}-O{number_offset + i}", User.Role.OFFICER, rank, full_name, country,
                avatar_bytes=avatar_bytes if i % 7 == 0 else None,
            )
            officers.append(OfficerProfile.objects.create(user=user, course=course, land_group=land_group))
        return officers

    def _create_directing_staff(self, course, count, number_offset=2000):
        avatar_bytes = self._load_avatar_bytes()
        ds_list = []
        for i in range(count):
            prefix, country = COUNTRIES[i % len(COUNTRIES)]
            full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            rank = random.choice(DS_RANKS)
            user = self._make_user(
                f"{prefix}-D{number_offset + i}", User.Role.DIRECTING_STAFF, rank, full_name, country,
                avatar_bytes=avatar_bytes if i % 5 == 0 else None,
            )
            ds_list.append(DirectingStaffProfile.objects.create(user=user, course=course))
        return ds_list

    def _load_avatar_bytes(self) -> bytes | None:
        path = settings.BASE_DIR.parent / "client" / "public" / "scsc-logo.jpg"
        return path.read_bytes() if path.exists() else None

    # ------------------------------------------------------------------
    # Activities / assignments / timetable / assessments

    def _create_activities(self, course, count):
        # Weights must sum to exactly 100.00 — a mix of 3.00s and 4.00s that
        # totals cleanly regardless of `count`, adjusting the last activity
        # to absorb any remainder so this stays correct for any --activities value.
        base = Decimal("100.00") / count
        base = base.quantize(Decimal("0.01"))
        weights = [base] * count
        remainder = Decimal("100.00") - sum(weights)
        weights[-1] += remainder

        names = (ACTIVITY_NAMES * ((count // len(ACTIVITY_NAMES)) + 1))[:count]
        return [
            Activity.objects.create(course=course, name=name, weight_percent=weight, is_mandatory=True)
            for name, weight in zip(names, weights)
        ]

    def _create_assignments(self, activities, ds_list, red, blue):
        cycle = list(ds_list)
        random.shuffle(cycle)
        idx = 0
        for activity in activities:
            red_ds = cycle[idx % len(cycle)]
            idx += 1
            blue_ds = cycle[idx % len(cycle)]
            while blue_ds.id == red_ds.id:
                idx += 1
                blue_ds = cycle[idx % len(cycle)]
            idx += 1
            ActivityAssignment.objects.create(activity=activity, land_group=red, directing_staff=red_ds)
            ActivityAssignment.objects.create(activity=activity, land_group=blue, directing_staff=blue_ds)

    def _generate_slots(self, count):
        base = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=14)
        slots = []
        for day in range(35):
            date = base + timedelta(days=day)
            if date.weekday() >= 5:
                continue
            for hour in (9, 11, 14):
                for room in ROOMS:
                    start = date.replace(hour=hour)
                    slots.append((room, start, start + timedelta(hours=2)))
        random.shuffle(slots)
        return slots[:count]

    def _create_timetable(self, activities, red, blue):
        slots = self._generate_slots(len(activities) * 2)
        i = 0
        for activity in activities:
            for land_group in (red, blue):
                room, start, end = slots[i]
                i += 1
                TimetableEntry.objects.create(activity=activity, land_group=land_group, room=room, start_at=start, end_at=end)

    def _create_assessment_schedules(self, activities, past_count=10):
        now = timezone.now()
        schedules = []
        for i, activity in enumerate(activities):
            deadline = now - timedelta(days=random.randint(2, 20)) if i < past_count else now + timedelta(days=random.randint(5, 45))
            schedules.append(
                AssessmentSchedule.objects.create(
                    activity=activity,
                    instructions=f"Prepare a written submission (.docx or .pdf) covering the key learning outcomes of {activity.name}.",
                    deadline=deadline,
                )
            )
        return schedules

    # ------------------------------------------------------------------
    # Submissions / marks / plagiarism

    def _create_submissions_marks_plagiarism(self, course, schedules, officers, ds_list, red, blue):
        past_schedules = [s for s in schedules if s.deadline < timezone.now()]
        assignment_by_land_group = {}
        for s in past_schedules:
            assignment_by_land_group[s.activity_id] = {
                a.land_group_id: a.directing_staff for a in ActivityAssignment.objects.filter(activity=s.activity)
            }

        duplicate_officer_count = 0
        for schedule_index, schedule in enumerate(past_schedules):
            submitters = random.sample(officers, k=int(len(officers) * random.uniform(0.55, 0.8)))
            for position, officer in enumerate(submitters):
                # First past activity gets 4 near-duplicate submissions on
                # purpose — a guaranteed, discoverable plagiarism match once a
                # DS runs a check, rather than leaving that entirely to chance.
                if schedule_index == 0 and duplicate_officer_count < 4:
                    text = DUPLICATE_TEXT
                    duplicate_officer_count += 1
                else:
                    text = random.choice(PARAGRAPH_TEMPLATES)

                storage_path = f"submissions/{course.code.replace('/', '-')}/{officer.id}/{schedule.id}.docx"
                saved_name = default_storage.save(storage_path, ContentFile(make_docx_bytes(text.split(". "))))

                submitted_at = schedule.deadline - timedelta(days=random.randint(1, 8))
                is_late = False
                if random.random() < 0.1:  # a few genuinely late submissions
                    submitted_at = schedule.deadline + timedelta(hours=random.randint(1, 30))
                    is_late = True

                submission = Submission.objects.create(
                    assessment=schedule, officer=officer, file_url=saved_name, file_type="docx", is_late=is_late,
                )
                Submission.objects.filter(pk=submission.pk).update(submitted_at=submitted_at)

                if random.random() < 0.7:
                    land_group_id = officer.land_group_id
                    marked_by = assignment_by_land_group[schedule.activity_id].get(land_group_id) or ds_list[0]
                    Mark.objects.create(
                        assessment=schedule,
                        officer=officer,
                        score=Decimal(random.randint(45, 96)),
                        remarks=random.choice(["Solid understanding of the material.", "Needs more depth in analysis.", "Well-structured submission.", "Good grasp of core concepts."]),
                        comments=random.choice(["Keep up the good work.", "Review the assigned reading again.", "Strong effort overall.", ""]),
                        is_complete=random.random() < 0.85,
                        marked_by=marked_by,
                    )

            # Pre-run a couple of real checks so "already completed" state
            # (View Report, source-attributed highlighting) is immediately
            # visible without requiring the tester to click first — most
            # submissions stay not_checked so the trigger itself stays testable.
            if schedule_index == 0:
                for submission in Submission.objects.filter(assessment=schedule)[:4]:
                    run_plagiarism_check(submission)

    # ------------------------------------------------------------------
    # Announcements

    def _create_announcements(self, admin, ds_list, course, activities):
        course_wide = Announcement.objects.create(
            sender=admin, title="Welcome to Course 2026/27",
            body="Welcome to the new course. Please review your timetable and assigned activities on the portal.",
            scope=Announcement.Scope.COURSE, course=course,
        )
        send_announcement(course_wide)

        officers_wide = Announcement.objects.create(
            sender=admin, title="Submission Deadlines Reminder",
            body="A reminder that all assessment deadlines are strictly enforced. Late submissions are flagged automatically.",
            scope=Announcement.Scope.ALL_OFFICERS,
        )
        send_announcement(officers_wide)

        ds = ds_list[0]
        activity = activities[0]
        activity_announcement = Announcement.objects.create(
            sender=ds.user, title=f"{activity.name} — Marking Update",
            body="Marking for this activity is now complete for the first batch of submissions. Remaining marks will follow shortly.",
            scope=Announcement.Scope.ACTIVITY, activity=activity,
        )
        send_announcement(activity_announcement)

        report = AssessmentReport.objects.filter(assessment__activity=activity).first()
        if report is None:
            schedule = activity.assessment_schedule
            AssessmentReport.objects.create(
                assessment=schedule, directing_staff=ds,
                body=f"Marking for {activity.name} is progressing well. Officers are generally demonstrating a strong grasp of the material, though a few require follow-up remediation.",
            )

    # ------------------------------------------------------------------
    # Archived course (Phase 8 — Archive)

    def _create_archived_course(self):
        course, red, blue = self._create_course("2024/25", 2024)
        officers = self._create_officers(course, red, blue, 10, number_offset=5000)
        ds_list = self._create_directing_staff(course, 3, number_offset=6000)
        activities = self._create_activities(course, 5)
        self._create_assignments(activities, ds_list, red, blue)

        now = timezone.now()
        for activity in activities:
            schedule = AssessmentSchedule.objects.create(
                activity=activity, instructions=f"Archived-course submission for {activity.name}.",
                deadline=now - timedelta(days=200),
            )
            for officer in officers:
                storage_path = f"submissions/{course.code.replace('/', '-')}/{officer.id}/{schedule.id}.docx"
                saved_name = default_storage.save(storage_path, ContentFile(make_docx_bytes(random.choice(PARAGRAPH_TEMPLATES).split(". "))))
                submission = Submission.objects.create(assessment=schedule, officer=officer, file_url=saved_name, file_type="docx", is_late=False)
                Submission.objects.filter(pk=submission.pk).update(submitted_at=now - timedelta(days=205))
                Mark.objects.create(
                    assessment=schedule, officer=officer, score=Decimal(random.randint(60, 95)),
                    remarks="Completed.", comments="", is_complete=True, marked_by=ds_list[0],
                )

        course.status = Course.Status.ARCHIVED
        course.save(update_fields=["status"])
