import {Actor} from '../../lib/actor.js'

export class WebMcp extends Actor {
  register() {
    navigator.modelContext.registerTool({
      name: 'getAlbums',
      description: [
        'Returns a list of all albums in the collection. Each album includes',
        'the name of the album, the name of the artist, a unique ID, and a list',
        'of tracks.',
      ].join(' '),
      inputSchema: {type: 'object', properties: {}},
      outputSchema: {
        type: 'object',
        properties: {
          albums: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                name: {type: 'string'},
                artist: {type: 'string'},
                tracks: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      execute: (_input, _agent) => this.getAlbums(),
    })

    navigator.modelContext.registerTool({
      name: 'addAlbum',
      description: [
        'Adds a new album to the collection. Requires the name of the album,',
        'the name of the artist, and a list of track names. Albums can also',
        'include cover art but must be uploaded separately by the user.',
        'Cover art should be square and at least 500x500 in resolution. Prompt',
        'the user to manually upload it.',
      ].join(' '),
      inputSchema: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          artist: {type: 'string'},
          tracks: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['name', 'artist', 'tracks'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          albumId: {type: 'string'},
        },
      },
      execute: (input, _agent) => this.addAlbum(input),
    })

    navigator.modelContext.registerTool({
      name: 'updateAlbum',
      description: [
        'Updates the name, artist, and/or tracks of an existing album. The',
        'album to update is identified by an id. Only the fields to update',
        'be provided.',
      ].join(' '),
      inputSchema: {
        type: 'object',
        properties: {
          id: {type: 'string'},
          updates: {
            type: 'object',
            properties: {
              artist: {type: 'string'},
              tracks: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
        required: ['id', 'updates'],
      },
      outputSchema: {
        type: 'object',
        properties: {},
      },
      execute: (input, _agent) => this.updateAlbum(input),
    })

    navigator.modelContext.registerTool({
      name: 'getCurrentAlbum',
      description: [
        'Return the album that the user is currently viewing.',
      ].join(' '),
      inputSchema: {type: 'object', properties: {}},
      outputSchema: {
        type: 'object',
        properties: {
          album: {
            type: 'object',
            properties: {
              id: {type: 'string'},
              name: {type: 'string'},
              artist: {type: 'string'},
              tracks: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      execute: (_input, _agent) => this.getCurrentAlbum(),
    })

    navigator.modelContext.registerTool({
      name: 'showAlbum',
      description: ['Show the user details for a given album, by id.'].join(
        ' ',
      ),
      inputSchema: {
        type: 'object',
        properties: {
          id: {type: 'string'},
        },
      },
      outputSchema: {
        type: 'object',
        properties: {},
      },
      execute: (input, _agent) => this.showAlbum(input),
    })

    navigator.modelContext.registerTool({
      name: 'filterAlbums',
      description: ['Show a list of only the albums with the given IDs.'].join(
        ' ',
      ),
      inputSchema: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {},
      },
      execute: (input, _agent) => this.filterAlbums(input),
    })
  }

  async getAlbums() {
    const docs = await this.db.albums.find({sort: [{name: 'asc'}]}).exec()
    const albums = docs
      .filter((doc) => !doc.deleted) // Odd workaround
      .map((doc) => ({
        id: doc.id,
        artist: doc.artist,
        name: doc.name,
        tracks: doc.tracks.map((track) => track.name),
      }))
    const text = albums
      .map(
        (album) =>
          `${album.artist} - ${album.name}\n` +
          album.tracks.map((track) => `  - ${track.name}`).join('\n'),
      )
      .join('\n')
    return {
      isError: false,
      content: [{type: 'text', text}],
      structuredContent: {albums},
    }
  }

  async addAlbum({name, artist, tracks}) {
    const doc = await this.db.albums.insert({
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      name,
      artist,
      tracks: tracks.map((trackName) => ({
        id: crypto.randomUUID(),
        name: trackName,
      })),
    })

    return {
      isError: false,
      content: [{type: 'text', text: doc.id}],
      structuredContent: {albumId: doc.id},
    }
  }

  async updateAlbum({id, updates}) {
    const doc = await this.db.albums.findOne(id).exec()

    updates.tracks &&= updates.tracks.map((name) => ({
      id: crypto.randomUUID(),
      name,
    }))

    await doc.incrementalPatch(updates)

    return {
      isError: false,
      content: [{type: 'text', text: 'Album updated.'}],
      structuredContent: {},
    }
  }

  async getCurrentAlbum() {
    const album = this.app.currentAlbum.get()

    if (!album) {
      return {
        isError: false,
        content: [
          {type: 'text', text: 'The user is not currently viewing an album.'},
        ],
        structuredContent: {album: null},
      }
    }

    return {
      isError: false,
      content:
        `${album.artist} - ${album.name}\n` +
        album.tracks.map((track) => `  - ${track.name}`).join('\n'),
      structuredContent: {
        album: {
          id: album.id,
          artist: album.artist,
          name: album.name,
          tracks: album.tracks.map((track) => track.name),
        },
      },
    }
  }

  async showAlbum({id}) {
    const doc = await this.db.albums.findOne(id).exec()

    if (!doc) {
      return {
        isError: true,
        content: [{type: 'text', text: 'There is no album with that ID.'}],
        structuredContent: {},
      }
    }

    this.navigator.navigate(`/${id}`)

    return {
      isError: false,
      content: [{type: 'text', text: 'Showing album.'}],
      structuredContent: {},
    }
  }

  async filterAlbums({ids}) {
    const docs = await this.db.albums.findByIds(ids).exec()
    console.log(ids, docs)

    if (ids.some((id) => !docs.has(id))) {
      return {
        isError: true,
        content: [
          {type: 'text', text: 'Some of the albums given do not exist.'},
        ],
        structuredContent: {},
      }
    }

    this.navigator.navigate(`/filter?ids=${ids.join('+')}`)

    return {
      isError: false,
      content: [{type: 'text', text: 'Showing filtered list of albums.'}],
      structuredContent: {},
    }
  }
}
