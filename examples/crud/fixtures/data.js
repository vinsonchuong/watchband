import path from 'node:path'
import fs from 'node:fs/promises'

const thisDirectory = path.dirname(new URL(import.meta.url).pathname)

export async function setupAlbumData(rxdb) {
  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: '9cbd281d-e20e-449e-9b14-36ca9d4dcc9e',
      updatedAt: Date.now(),
      artist: "L'Indécis",
      name: 'Playtime',
      tracks: [
        {id: '7e53cd26-016d-4863-90a2-cf32b56931dc', name: 'Check It Out'},
        {id: 'a43e2e46-63ad-43c0-a31a-716245ec3dc2', name: 'Soulful'},
        {id: 'b8e6c8e9-ea7d-4c56-b55d-93c8ac666e4f', name: 'Blind'},
        {id: '83513082-7003-491d-bbd8-8cba7e533ec1', name: 'Le Sud'},
        {id: '2cc673f0-19b1-4608-a076-46f674d7c8f1', name: 'Crossing Borders'},
        {id: 'd8ce9d65-25e9-4560-9c74-4288a6905ba7', name: 'Rekindling'},
        {id: '876511fd-f961-4b63-b8ae-73151956e3e6', name: 'Playtime'},
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/jpeg',
        data: await getFile('playtime.jpg'),
      })
    }
  }

  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: '3d84c5d7-5b62-41f2-bc28-7d595f95513d',
      updatedAt: Date.now(),
      artist: 'Luxid & Leorinda',
      name: 'Ctrl R (feat. demxntia)',
      tracks: [
        {
          id: '9fad59a5-08bf-4127-bf2a-2d46c17599f9',
          name: 'Ctrl R (feat. demxntia)',
        },
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/png',
        data: await getFile('ctrlr.png'),
      })
    }
  }

  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: 'b4b27fd4-3950-4d2f-9942-c5b02706e192',
      updatedAt: Date.now(),
      artist: 'Unlike Pluto',
      name: '8 Legged Dreams',
      tracks: [
        {
          id: '94e55658-c78a-4285-8e8d-5875882bd981',
          name: '8 Legged Dreams',
        },
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/jpeg',
        data: await getFile('8-legged-dreams.jpg'),
      })
    }
  }

  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: '96824673-fc56-406d-a252-be0c5175e559',
      updatedAt: Date.now(),
      artist: 'ARIA LEX',
      name: 'Falling over my head',
      tracks: [
        {
          id: 'bca35f74-3be3-4c19-8db9-a79705263a64',
          name: 'Falling over my head',
        },
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/jpeg',
        data: await getFile('falling-over-my-head.jpg'),
      })
    }
  }

  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: 'e8446e62-aefd-4d98-b0df-a7919bde050c',
      updatedAt: Date.now(),
      artist: 'Borislav Slavov',
      name: "Baldur's Gate 3 - Original Soundtrack",
      tracks: [
        {id: '4a70de6e-e5ec-4789-ac82-7ae1e768c38d', name: 'Main Theme Part I'},
        {
          id: 'e42c7266-66db-4d68-a207-d8c184e30d1f',
          name: 'Main Theme Part II',
        },
        {id: 'bc3a9f56-3f58-4974-b9d7-2e342d38fbd9', name: 'Mind Flayer Theme'},
        {id: '093870cd-7909-406b-83a2-896fb22021c1', name: 'Who Are You'},
        {id: '0188bb2c-0098-4feb-89b5-95cb9287f01c', name: 'Nine Blades'},
        {id: 'b10ec7e1-539c-44fe-90d8-dfeebc701f51', name: 'Quest For A Cure'},
        {id: 'e802e51c-47b9-4ffb-a3ab-86fa460aca10', name: 'Lead Your Fights'},
        {id: '45410b96-a5d3-4cbe-8c99-15f7bf40565b', name: 'Harpy Song'},
        {id: 'bdc1bc58-b9a7-48db-be3e-d9ccc98ca884', name: 'Weeping Dawn'},
        {
          id: 'd761e3fb-2184-4d51-95ad-b471ceeaaab6',
          name: 'Cunning Cruel Crits',
        },
        {
          id: '8388289d-df62-4390-aed4-9243a43a5cf8',
          name: 'The Cult of the Absolute',
        },
        {id: 'a334629a-0ebb-4d61-aa29-135a85dc5bab', name: 'Sixteen Strikes'},
        {
          id: '1ed5bff8-553f-4a6a-8476-a0f4b56d0290',
          name: 'The Colors of Underdark',
        },
        {id: '6e7086a8-03ce-45ab-8e91-ad37e0b4def7', name: 'Twisted Force'},
        {
          id: 'df66962a-44a5-4257-ab81-fe3a633b01f2',
          name: 'Shadows, Curse And Death',
        },
        {id: 'cad82605-3cd5-4fe6-97af-569012b3a9e4', name: 'Last Light'},
        {id: '36d6ff0d-7248-4e24-a899-5c2329e4fd54', name: 'Old Time Battles'},
        {
          id: 'bb8c9a16-a6ca-4963-881b-63d02c062e08',
          name: 'I Want To Live (Instrumental version)',
        },
        {id: '7b5e0fc2-b5ea-4945-846f-db3a817bfe03', name: 'Nightsong'},
        {
          id: '2e755948-1921-4464-af7f-9c788d6d1076',
          name: 'The Power (Choral version)',
        },
        {
          id: '9b5c72aa-c092-44d6-8263-efbf01a026f0',
          name: 'Old Time Battles (Bard version)',
        },
        {
          id: '6d41ccd3-78bd-4f4c-b655-90f7a07673de',
          name: 'The Power (Orchestral version)',
        },
        {
          id: '1577443b-3ed9-4856-82da-644b30a987b5',
          name: 'A Threat From Nether Years',
        },
        {id: '8fcecd44-a4ab-4525-a30b-c373dd86ac4d', name: 'Surgery Of A Hope'},
        {id: '459945f9-2647-429f-878f-2d1d8fbe6619', name: 'Last Shelter'},
        {
          id: 'ead41496-7d68-4892-b31b-da375bf0f8d3',
          name: 'The Odds Are Cast Anew',
        },
        {
          id: '4eff3c9d-6842-4049-aa08-c6657eb8ff75',
          name: 'Gather Your Allies!',
        },
        {
          id: 'efa12a33-b0c1-4d0c-97db-14e1563f2c52',
          name: 'Dream Walk (Instrumental version)',
        },
        {id: '25e0eba3-16eb-4f30-b06c-43e3bd41565e', name: 'Bard Dance'},
        {id: 'f332b41a-156c-4397-a894-69feab7d3cec', name: 'Lead Your Way'},
        {id: 'd149fa4f-8f1e-49b7-8ff8-9e996cb2c16c', name: 'Song Of Balduran'},
        {
          id: '503000f6-67f0-4885-8252-6755144c1e88',
          name: 'The Legacy of Bhaal',
        },
        {id: 'daa5353b-6909-4767-a4da-a9fff4ec018f', name: 'Elder Brain'},
        {id: 'a7cb9ead-0f73-4e30-85a4-a744a6114a8c', name: 'Forging The Fate'},
        {
          id: '231aef13-2d50-4c5f-a963-7fe1b0dfba49',
          name: "The Road To Baldur's Gate",
        },
        {
          id: 'd775c025-d473-44f3-a5c4-d327373313c2',
          name: "Raphael's Final Act",
        },
        {
          id: '345f6d8b-c4e3-4a9e-92e6-ce3fc6630490',
          name: 'The Grand Design (Requiem)',
        },
        {
          id: '388a8b76-af9e-4a97-b50f-99f9e6204388',
          name: 'Old Time Battles - Part II',
        },
        {id: 'bc9d2568-8585-4722-b039-2ad8c2541e2e', name: 'Down By The River'},
        {
          id: '787b03ca-e47a-4b94-b5e9-658d2237e440',
          name: 'I Want To Live (Classical version)',
        },
        {
          id: '0306c148-2946-41e3-ba51-53d32cccb995',
          name: 'Main Theme Part III',
        },
        {id: '1e30994f-3f29-4e64-9596-5cde069aaa5a', name: 'I Want To Live'},
        {
          id: 'aa68876c-4034-46c8-a89c-fb87b81b79db',
          name: 'The Power (Credits Song)',
        },
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/jpeg',
        data: await getFile('bg3.jpg'),
      })
    }
  }

  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: '965bfe34-df38-4538-8a6b-7f5a9958f5e2',
      updatedAt: Date.now(),
      artist: 'SOCKiTTOME & Eggnarok',
      name: 'disguise (Eggnarok Remix)',
      tracks: [
        {
          id: 'fce70cbc-6eb1-4f01-ac27-bcb32cd09133',
          name: 'disguise (Eggnarok Remix)',
        },
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/jpeg',
        data: await getFile('disguise.jpg'),
      })
    }
  }

  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: 'a68877fc-91b3-4668-9faf-1246a8ff1090',
      updatedAt: Date.now(),
      artist: 'AViVA',
      name: 'Children in The Dark',
      tracks: [
        {
          id: '700b24c4-bbb8-4119-83cb-a0fb38a279e7',
          name: 'Children in The Dark',
        },
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/jpeg',
        data: await getFile('children-in-the-dark.jpg'),
      })
    }
  }

  {
    const doc = await rxdb.albums.insertIfNotExists({
      id: 'c3f77548-007d-4402-9e79-a2898fce27ec',
      updatedAt: Date.now(),
      artist: 'Neovaii',
      name: 'Aurora',
      tracks: [
        {
          id: 'f16c7f99-11ad-49f6-89fb-657cb9a8c2ba',
          name: 'Getaway',
        },
        {
          id: 'f904079c-583d-4be1-8828-30ec237f0792',
          name: 'Anxious',
        },
        {
          id: '420dbdbe-5016-4bff-8690-f2a292a84979',
          name: 'Float Away',
        },
        {
          id: '4a3abc94-8549-44eb-a8f2-50b91627971f',
          name: 'Think of You',
        },
        {
          id: 'de908759-607e-41c3-9dd1-28af0be53f41',
          name: 'Unstoppable',
        },
        {
          id: '88d59975-21b6-40ac-92a7-b9e786c80d6f',
          name: 'Calling Out',
        },
        {
          id: 'b69163d5-64ca-4ab1-a2c7-ad1c0a319433',
          name: 'When I Go',
        },
      ],
    })
    if (!doc.getAttachment('cover')) {
      await doc.putAttachment({
        id: 'cover',
        type: 'image/jpeg',
        data: await getFile('aurora.jpg'),
      })
    }
  }
}

async function getFile(fileName) {
  return fs.readFile(path.join(thisDirectory, fileName), 'base64')
}
