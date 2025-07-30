// service/bookmarkService.ts

import { apiClient } from './apiClient'
import * as SecureStore from 'expo-secure-store'

export interface BookmarkCreate {
  contentId: number
  title: string
  firstImage: string
  addr1: string
  overview: string
}

export interface BookmarkResponse {
  id: number
  user: string
  contentId: number
  title: string
  firstImage: string
  addr1: string
  overview: string
  createdAt: string
}

function toSnakePayload(data: BookmarkCreate) {
  return {
    content_id: data.contentId,
    title: data.title,
    first_image: data.firstImage,
    addr1: data.addr1,
    overview: data.overview,
  }
}

function toCamelResponse(item: any): BookmarkResponse {
  return {
    id: item.id,
    user: item.user,
    contentId: item.content_id,
    title: item.title,
    firstImage: item.first_image,
    addr1: item.addr1,
    overview: item.overview,
    createdAt: item.created_at,
  }
}

export const bookmarkService = {
  /** 북마크 추가 */
  async addBookmark(data: BookmarkCreate): Promise<BookmarkResponse> {
    const token = await SecureStore.getItemAsync('accessToken')
    console.log('[bookmarkService] token:', token)

    const payload = toSnakePayload(data)
    console.log('[bookmarkService] addBookmark payload:', payload)

    try {
      const res = await apiClient.post(
        '/users/bookmarks/',
        payload,
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      )
      console.log(
        '[bookmarkService] addBookmark response:',
        res.status,
        res.data
      )
      return toCamelResponse(res.data)
    } catch (e: any) {
      console.error(
        '[bookmarkService] addBookmark error:',
        e.response?.status,
        e.response?.data,
        e.message
      )
      throw e
    }
  },

  /** 북마크 삭제 */
  async deleteBookmark(bookmarkId: number): Promise<void> {
    const token = await SecureStore.getItemAsync('accessToken')
    console.log('[bookmarkService] token:', token)
    console.log('[bookmarkService] deleteBookmark id:', bookmarkId)

    try {
      const res = await apiClient.delete(
        `/users/bookmarks/${bookmarkId}/`,
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      )
      console.log(
        '[bookmarkService] deleteBookmark response:',
        res.status
      )
    } catch (e: any) {
      console.error(
        '[bookmarkService] deleteBookmark error:',
        e.response?.status,
        e.response?.data,
        e.message
      )
      throw e
    }
  },

  /** 북마크 목록 조회 */
  async getBookmarks(): Promise<BookmarkResponse[]> {
    const token = await SecureStore.getItemAsync('accessToken')
    console.log('[bookmarkService] token:', token)
    console.log('[bookmarkService] getBookmarks called')

    try {
      const res = await apiClient.get(
        '/users/bookmarks/',
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      )
      console.log(
        '[bookmarkService] getBookmarks response:',
        res.status,
        res.data
      )
      if (Array.isArray(res.data)) {
        return res.data.map(toCamelResponse)
      }
      return []
    } catch (e: any) {
      console.error(
        '[bookmarkService] getBookmarks error:',
        e.response?.status,
        e.response?.data,
        e.message
      )
      throw e
    }
  },
}
