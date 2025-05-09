--
-- PostgreSQL database dump
--

-- Dumped from database version 17.1 (Homebrew petere/postgresql)
-- Dumped by pg_dump version 17.1 (Homebrew petere/postgresql)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: pet_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_categories (
    name text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: pet_categories_pet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_categories_pet (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pet_id uuid NOT NULL,
    pet_category_id uuid NOT NULL
);


--
-- Name: pets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text,
    meta jsonb,
    image bytea
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name text,
    last_name text,
    username text NOT NULL,
    birthdate timestamp with time zone
);


--
-- Name: pet_categories pet_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_categories
    ADD CONSTRAINT pet_categories_name_key UNIQUE (name);


--
-- Name: pet_categories_pet pet_categories_pet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_categories_pet
    ADD CONSTRAINT pet_categories_pet_pkey PRIMARY KEY (id);


--
-- Name: pet_categories pet_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_categories
    ADD CONSTRAINT pet_categories_pkey PRIMARY KEY (id);


--
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_uniq UNIQUE (username);


--
-- Name: pet_categories_pet pet_categories_category_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_categories_pet
    ADD CONSTRAINT pet_categories_category_fk FOREIGN KEY (pet_category_id) REFERENCES public.pet_categories(id);


--
-- Name: pet_categories_pet pet_categories_pet_pet_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_categories_pet
    ADD CONSTRAINT pet_categories_pet_pet_fk FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pets pets_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

