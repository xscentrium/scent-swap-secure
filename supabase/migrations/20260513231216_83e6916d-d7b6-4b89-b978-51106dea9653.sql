
WITH updates(id, brand, name, price, image_url) AS (VALUES
  ('43ba7e8f-127e-462f-b38c-9e9a460c9f76'::uuid,'Parfums de Marly','Layton',285.00,'https://images.hernas.com/s3/ucm16go8fk0002770h9iof2y7n/a/7/a790d031-3ec9-4af9-b98a-58ab586fb41c_layton.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('da4da310-4ca9-49c3-8d7d-3a2ccfd5e1b9','Parfums de Marly','Herod',295.00,'https://images.hernas.com/s3/global/a/2/a2d584c3-ed21-43c2-b844-5783c75e5770_e6dab109-e177-46c3-b5e9-faad49ad8a7c.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('511f371c-2d13-49ee-a923-7fcc9d4acb7d','Parfums de Marly','Delina',NULL,'https://images.hernas.com/s3/global/1/a/1a5037be-838c-49ee-81f5-5b24b481bdb1_4242deea-1b25-413a-9fef-fd7703d09adc.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('326f4163-6f00-4678-9e6a-1426c889d8ee','Parfums de Marly','Pegasus',275.00,'https://images.hernas.com/s3/global/2/3/23a6e223-092a-4f3f-a4ab-63be16d3d4db_205ac0f1-91de-4c8a-a403-681326fc6f8b.jpeg?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('b5729236-bcb8-4758-8ccd-a8df04293f93','Penhaligon''s','Halfeti',265.00,'https://images.hernas.com/s3/global/0/a/0a68b636-10a2-4905-ae5e-008a52627995_b461d984-ec19-408d-ac73-ce50bd544110.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('b096e698-40fd-428a-801b-baadf8b45147','Penhaligon''s','The Tragedy of Lord George',245.00,'https://images.hernas.com/s3/global/c/4/c4ee4a30-5152-4c84-9e27-8092d2cfac3f_e2173d53-3007-4738-976a-5ca2bfc0bed9.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('781c00a6-91ad-493d-88c8-a37e8b94ddd8','Amouage','Interlude Man',345.00,'https://images.hernas.com/s3/global/e/e/ee621792-7b4b-42d6-9542-48f8c87e3781_d6721250-d8a4-436e-a4fd-81c749fd796d.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('a9499b30-19a9-4051-8870-d6c0eefe9b59','Amouage','Reflection Man',325.00,'https://images.hernas.com/s3/global/9/e/9e204d6b-815b-4007-bb7e-3ca365ed1668_6edb4369-7c80-4859-a6a9-c2c997f3c25f.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('5b0ada94-326a-42a1-8a65-ceff2f2c3570','Maison Francis Kurkdjian','Baccarat Rouge 540',425.00,'https://images.hernas.com/s3/global/7/f/7f0a8032-e64a-4048-a162-a626263b635b_a58854c1-47a3-4bfa-b209-6bcfd9395fb1.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('a87ad523-4e04-411e-a818-1ab1f9911787','Maison Francis Kurkdjian','Oud Satin Mood',385.00,'https://images.hernas.com/s3/global/8/e/8e23c9b7-4e91-4e73-9a5b-a93955c6546d_1abafcde-3c84-4763-910b-37f5dc077232.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('c2f4b5be-b19b-40ea-8e75-8b6f62addc39','Creed','Aventus',495.00,'https://images.hernas.com/s3/global/4/f/4f1cb5e5-4ed3-481d-935b-6dc1cabf97cb_c1466177-5ae0-4ee1-bc53-6ca92e2db7d5.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('a836936d-5607-4059-91b9-84183c3bff9d','Creed','Green Irish Tweed',445.00,'https://images.hernas.com/s3/global/2/c/2c7548b8-7c8a-48b6-a73f-7831b60fb27e_04114dc3-8a81-4b64-a835-2305e3ad9f50.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('d21845fd-b705-4c56-8368-51e695f88abb','Tom Ford','Tobacco Vanille',365.00,'https://images.hernas.com/s3/global/e/f/ef0b60ec-a8e7-4cf3-8768-69e903876c06_9dc078a0-4e34-4f2f-bfe1-990a729c3969.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('3c8e2026-d052-4784-bda5-81397110bcab','Tom Ford','Oud Wood',395.00,'https://images.hernas.com/s3/global/e/a/ea077419-3c62-4d22-b7e6-10ed3a31132b_d0231d9e-7bfb-40d0-a51d-684797ad962d.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('d8ab6e31-a1b2-453e-83ce-e95dbebb3ae2','Dior','Sauvage Elixir',225.00,'https://images.hernas.com/s3/global/2/0/200b4d03-ea9d-43ff-86a0-113c3cfa84bb_d5c90867-0a0f-4e08-8ea9-c51e894859b9.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('2c98987a-ffa1-4932-987b-5e6bc561af96','Chanel','Bleu de Chanel Parfum',195.00,'https://images.hernas.com/s3/global/2/a/2a73506c-753c-4261-9b9d-d4e0e757d3bf_50756d1a-58eb-41d0-946a-f89573e52635.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('69d120dc-9914-4d2e-9c7a-c74b0d94d40a','Roja Parfums','Elysium Pour Homme',425.00,'https://images.hernas.com/s3/global/1/c/1cec0cb8-aaa5-4d94-9479-504d8b95bcee_bad5dd83-1b99-4075-998a-c7ac256d7e1f.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('f88b0302-e204-4f9b-b67c-0f34eebb85ad','Xerjoff','Erba Pura',355.00,'https://images.hernas.com/s3/global/f/b/fb0aa5b7-aaab-4b08-be8e-a5f9ee0312e1_11982d87-fa56-4fa2-96de-0b0df65bc2e7.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('2cf2c04b-ee12-45fa-a07f-c781eb2511c2','Nishane','Hacivat',295.00,'https://images.hernas.com/s3/global/7/d/7d227446-5d44-46ee-8170-1cf605199ab3_59ad5cb2-321a-4a1a-8dc9-abab3166e1d1.png?tr=w-300,q-85,f-auto,bg-FFFFFF'),
  ('470a8835-f11d-4077-97ce-8db38c656d0b','Le Labo','Another 13',225.00,'https://images.hernas.com/s3/global/d/1/d1de20b6-bbca-4162-8282-c562c8b51140_1624f2ea-ebd6-4a69-8b3a-2ab9a62b987e.png?tr=w-300,q-85,f-auto,bg-FFFFFF')
)
UPDATE public.listings l
SET brand = u.brand,
    name = u.name,
    price = COALESCE(u.price, l.price),
    estimated_value = COALESCE(u.price, l.estimated_value),
    image_url = u.image_url,
    updated_at = now()
FROM updates u
WHERE l.id = u.id;

-- Mark all 20 listing photos as verified so they display on the homepage.
UPDATE public.listing_image_verifications
SET status = 'verified',
    reason = 'Curated demo photo from approved retailer source.'
WHERE listing_id IN (
  '43ba7e8f-127e-462f-b38c-9e9a460c9f76','da4da310-4ca9-49c3-8d7d-3a2ccfd5e1b9',
  '511f371c-2d13-49ee-a923-7fcc9d4acb7d','326f4163-6f00-4678-9e6a-1426c889d8ee',
  'b5729236-bcb8-4758-8ccd-a8df04293f93','b096e698-40fd-428a-801b-baadf8b45147',
  '781c00a6-91ad-493d-88c8-a37e8b94ddd8','a9499b30-19a9-4051-8870-d6c0eefe9b59',
  '5b0ada94-326a-42a1-8a65-ceff2f2c3570','a87ad523-4e04-411e-a818-1ab1f9911787',
  'c2f4b5be-b19b-40ea-8e75-8b6f62addc39','a836936d-5607-4059-91b9-84183c3bff9d',
  'd21845fd-b705-4c56-8368-51e695f88abb','3c8e2026-d052-4784-bda5-81397110bcab',
  'd8ab6e31-a1b2-453e-83ce-e95dbebb3ae2','2c98987a-ffa1-4932-987b-5e6bc561af96',
  '69d120dc-9914-4d2e-9c7a-c74b0d94d40a','f88b0302-e204-4f9b-b67c-0f34eebb85ad',
  '2cf2c04b-ee12-45fa-a07f-c781eb2511c2','470a8835-f11d-4077-97ce-8db38c656d0b'
);
