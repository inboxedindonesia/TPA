--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id character varying(255),
    user_name character varying(255),
    user_role character varying(50),
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(255),
    entity_name character varying(255),
    details jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answers (
    id character varying(255) NOT NULL,
    "selectedAnswer" character varying(255) NOT NULL,
    "isCorrect" boolean DEFAULT false,
    "pointsEarned" integer DEFAULT 0,
    "answeredAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "sessionId" character varying(255) NOT NULL,
    "questionId" character varying(255) NOT NULL
);


ALTER TABLE public.answers OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id character varying(255) NOT NULL,
    question text NOT NULL,
    type character varying(50) NOT NULL,
    options text,
    "correctAnswer" character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    difficulty character varying(50) NOT NULL,
    explanation text,
    "order" integer DEFAULT 0,
    points integer DEFAULT 1,
    "testId" character varying(255) NOT NULL,
    "creatorId" character varying(255) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    kategori character varying(100),
    subkategori character varying(100),
    tipejawaban character varying(50) DEFAULT 'TEXT'::character varying,
    gambar character varying(500),
    gambarjawaban text,
    tipesoal character varying(50) DEFAULT 'PILIHAN_GANDA'::character varying,
    levelkesulitan character varying(50) DEFAULT 'SEDANG'::character varying,
    deskripsi text,
    allowmultipleanswers boolean DEFAULT false
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    permissions jsonb NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT roles_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: test_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_questions (
    id integer NOT NULL,
    test_id character varying(255) NOT NULL,
    question_id character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.test_questions OWNER TO postgres;

--
-- Name: test_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.test_questions_id_seq OWNER TO postgres;

--
-- Name: test_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_questions_id_seq OWNED BY public.test_questions.id;


--
-- Name: test_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_sessions (
    id character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'ONGOING'::character varying,
    "startTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "endTime" timestamp without time zone,
    score integer DEFAULT 0,
    "maxScore" integer DEFAULT 0,
    "userId" character varying(255) NOT NULL,
    "testId" character varying(255) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.test_sessions OWNER TO postgres;

--
-- Name: tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tests (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    duration integer NOT NULL,
    "totalQuestions" integer DEFAULT 0,
    "isActive" boolean DEFAULT true,
    "creatorId" character varying(255) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tests OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role_id character varying(50),
    nim character varying(50),
    fakultas character varying(100),
    prodi character varying(100),
    tempat_lahir character varying(100),
    tanggal_lahir date,
    jenis_kelamin character varying(20),
    phone character varying(30),
    alamat text,
    agama character varying(50),
    angkatan character varying(10),
    tahun_masuk character varying(10)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: test_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_questions ALTER COLUMN id SET DEFAULT nextval('public.test_questions_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, entity_name, details, ip_address, user_agent, created_at) FROM stdin;
54	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-31 23:45:10.499809
55	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-31 23:45:25.69429
56	admin-1	Admin TPA	ADMIN	DELETE	QUESTION	q-1753979921741-idssbjnigx	Test question from admin 4	\N	\N	\N	2025-07-31 23:45:49.976133
57	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	curl/7.53.1	2025-07-31 23:48:49.274313
58	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	curl/7.53.1	2025-07-31 23:50:31.877088
59	user-1	user	Peserta	CREATE	QUESTION	q-1753980644213-csxsbnyryjh	Test question from Nalendra	\N	\N	\N	2025-07-31 23:50:44.229479
60	user-1	user	Peserta	DELETE	QUESTION	q-1753980644213-csxsbnyryjh	Test question from Nalendra	\N	\N	\N	2025-07-31 23:50:55.354727
61	user-1	Nalendra	Peserta	CREATE	QUESTION	q-1753980703443-k4h5efvl8qg	Test question from Nalendra 2	\N	\N	\N	2025-07-31 23:51:43.457291
62	admin-1	Admin TPA	Administrator	CREATE	QUESTION	q-1753980717867-obrbv3esd9	Test question from Admin TPA	\N	\N	\N	2025-07-31 23:51:57.871082
63	user-1	Nalendra	Peserta	CREATE	QUESTION	q-1753980798700-2fwecwr4afh	Final test question from Nalendra	\N	\N	\N	2025-07-31 23:53:18.719506
64	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 04:54:32.505332
65	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 04:54:46.275163
66	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 17:20:54.626539
67	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 17:57:28.575116
68	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 18:13:51.942198
69	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 13:22:30.559173
70	admin-1	Admin TPA	ADMIN	DELETE	QUESTION	q-1753980798700-2fwecwr4afh	Final test question from Nalendra	\N	\N	\N	2025-08-04 13:22:39.427089
71	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 13:37:33.555359
72	user-1753881851057	Nalendra	Administrator	TEST	QUESTION	test-question-id	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 13:48:20.129824
73	user-1753881851057	Nalendra	Administrator	TEST	QUESTION	test-question-id	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 13:48:23.762202
74	user-1753881851057	Nalendra	Administrator	TEST	QUESTION	test-question-id	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 13:48:41.30686
75	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 13:53:56.721541
76	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 13:53:56.994639
77	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 20:26:13.521851
78	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 20:26:14.226812
79	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 21:31:37.413627
80	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 21:31:37.746905
81	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 21:35:51.003931
82	user-1	user	Peserta	LOGIN	USER	user-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 21:35:51.288783
83	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 12:52:25.93451
84	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 12:52:26.537521
85	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 13:22:52.456558
86	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 13:22:52.826908
87	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 13:25:22.647323
88	user-1	user	Peserta	LOGIN	USER	user-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 13:25:22.813331
91	admin-1	Admin TPA	ADMIN	DELETE	TEST	test-1753978935469-a7gwyluo0	Tes Matematika Dasar	\N	\N	\N	2025-08-20 13:46:45.757611
52	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-31 23:44:00.650213
53	admin-1	Admin TPA	ADMIN	DELETE	QUESTION	q-1753980006352-1uvgv0a4k41	Test question from user	\N	\N	\N	2025-07-31 23:44:09.872316
89	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 13:25:51.618394
90	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 13:25:51.76792
92	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 14:45:51.33292
93	user-1	user	Peserta	LOGIN	USER	user-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 14:45:51.711681
94	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 14:46:03.704158
95	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Unknown	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 14:46:03.8532
96	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 14:51:40.399145
97	admin-1	Admin TPA	Administrator	LOGOUT	USER	admin-1	Admin TPA	\N	\N	\N	2025-08-20 14:54:19.274724
98	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 14:55:24.59892
99	admin-1	Admin TPA	ADMIN	DELETE	TEST	test-1	TPA Test	\N	\N	\N	2025-08-20 15:09:27.676159
100	admin-1	Admin TPA	ADMIN	DELETE	TEST	test-1753978312967-qrqccszxg	Tes Matematika Lanjutan	\N	\N	\N	2025-08-20 15:09:31.744961
101	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 15:48:31.760766
102	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 10:43:48.578905
103	admin-1	Admin TPA	Administrator	LOGOUT	USER	admin-1	Admin TPA	\N	\N	\N	2025-08-21 10:52:20.411265
104	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 10:52:28.065611
105	user-1	user	Peserta	LOGOUT	USER	user-1	user	\N	\N	\N	2025-08-21 12:04:33.875398
106	user-1	user	Peserta	LOGIN	USER	user-1	user	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 12:04:43.516052
107	user-1	user	Peserta	LOGOUT	USER	user-1	user	\N	\N	\N	2025-08-21 12:22:43.326451
108	user-1753881851057	Nalendra	Administrator	LOGIN	USER	user-1753881851057	Nalendra	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 12:23:02.802933
109	user-1753881851057	Nalendra	Administrator	LOGOUT	USER	user-1753881851057	Nalendra	\N	\N	\N	2025-08-21 12:23:25.484987
110	user-1753950251088	nalen	Peserta	LOGIN	USER	user-1753950251088	nalen	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 12:23:33.764754
111	user-1753950251088	nalendra	Peserta	LOGOUT	USER	user-1753950251088	nalendra	\N	\N	\N	2025-08-21 15:17:51.663254
112	admin-1	Admin TPA	Administrator	LOGIN	USER	admin-1	Admin TPA	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 15:17:59.936546
\.


--
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.answers (id, "selectedAnswer", "isCorrect", "pointsEarned", "answeredAt", "sessionId", "questionId") FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, question, type, options, "correctAnswer", category, difficulty, explanation, "order", points, "testId", "creatorId", "createdAt", "updatedAt", kategori, subkategori, tipejawaban, gambar, gambarjawaban, tipesoal, levelkesulitan, deskripsi, allowmultipleanswers) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, permissions, status, created_at, updated_at) FROM stdin;
role-admin	Administrator	Role untuk administrator sistem dengan akses penuh	["dashboard:read", "users:read", "users:create", "users:update", "users:delete", "roles:read", "roles:create", "roles:update", "roles:delete", "tests:read", "tests:create", "tests:update", "tests:delete", "questions:read", "questions:create", "questions:update", "questions:delete", "results:read", "results:export", "system:settings"]	active	2025-07-30 21:03:22.732885	2025-07-30 21:03:22.732885
role-peserta	Peserta	Role untuk peserta tes dengan akses terbatas	["dashboard:read", "tests:read", "results:read"]	active	2025-07-30 21:03:22.732885	2025-07-30 21:03:22.732885
role-moderator	Moderator	Role untuk moderator dengan akses menengah	["dashboard:read", "users:read", "tests:read", "tests:update", "questions:read", "questions:update", "results:read", "results:export"]	active	2025-07-30 21:03:22.732885	2025-07-30 21:03:22.732885
\.


--
-- Data for Name: test_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_questions (id, test_id, question_id, created_at) FROM stdin;
\.


--
-- Data for Name: test_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_sessions (id, status, "startTime", "endTime", score, "maxScore", "userId", "testId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tests (id, name, description, duration, "totalQuestions", "isActive", "creatorId", "createdAt", "updatedAt") FROM stdin;
test-1753978493175-djkqx3i5f	Tes Pengetahuan Umum	Tes pengetahuan umum untuk semua peserta	45	0	t	admin-1	2025-07-31 23:14:53.176545	2025-07-31 23:14:53.176545
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, "createdAt", "updatedAt", role_id, nim, fakultas, prodi, tempat_lahir, tanggal_lahir, jenis_kelamin, phone, alamat, agama, angkatan, tahun_masuk) FROM stdin;
admin-1	Admin TPA	admin@tpa.com	$2a$10$t6RaeMRBVMJoYqA76sF./.nhDbSrgBKBuGP1DqZHzVkQFIQ2QfM7u	2025-07-30 16:50:06.789625	2025-07-30 16:50:06.789625	role-admin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
user-1	user	user@tpa.com	$2a$10$xZUJauWA6MjAhJXcIeIpDOBY1l27BW4R8wXKkeIA9MDmuOFwMNd1.	2025-07-30 16:50:06.864155	2025-07-30 20:36:28.978776	role-peserta	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
user-1753884627848	Test User	test@example.com	$2a$10$93iW1Zk0a3YDX6JULFIM8ujbH86J.hN4bz8KkED21JKdD7lOzm11C	2025-07-30 21:10:27.848763	2025-07-30 21:10:27.848763	role-moderator	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
user-1753885376341	alip	alipibrahim009@gmail.com	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	2025-07-30 21:22:56.341575	2025-07-30 21:22:56.341575	role-admin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
user-1753881851057	Nalendra	itsnalendraa@gmail.com	$2a$10$EUj7IvHJjbcNg7U2HZwSJ.912L8Q/He6KPdBci00W0iT20bNb1Kna	2025-07-30 20:24:11.057809	2025-07-30 21:53:39.553259	role-admin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
user-1753950251088	nalen	nalendra@gmail.com	$2a$10$3K2zjadPFZDfPdgTEuLXxu/UTQlLYlF.cT4SxHaEm0z2ZJ1A/6Ob2	2025-07-31 15:24:11.089004	2025-07-31 15:24:11.089004	role-peserta	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
user-1753951604929	Muhammad Wahyu Nalendra	muhammadwahyunalendra@gmail.com	$2a$10$I4rDFVrIEajAbabX21Wjiu7lZxAsfyO8qIw/b0kQccIZt9tbzxPaG	2025-07-31 15:46:44.929264	2025-07-31 15:46:44.929264	role-peserta	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 112, true);


--
-- Name: test_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_questions_id_seq', 2, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_test_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_test_id_question_id_key UNIQUE (test_id, question_id);


--
-- Name: test_sessions test_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sessions
    ADD CONSTRAINT test_sessions_pkey PRIMARY KEY (id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: answers answers_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: answers answers_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.test_sessions(id) ON DELETE CASCADE;


--
-- Name: questions questions_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id);


--
-- Name: questions questions_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_testId_fkey" FOREIGN KEY ("testId") REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: test_sessions test_sessions_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sessions
    ADD CONSTRAINT "test_sessions_testId_fkey" FOREIGN KEY ("testId") REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: test_sessions test_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sessions
    ADD CONSTRAINT "test_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tests tests_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT "tests_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

