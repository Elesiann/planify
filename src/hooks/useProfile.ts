import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/auth'

export type Profile = {
    id: string
    name: string | null
    email: string | null
    income: number | null
    avatar_url: string | null
}

export type ProfileUpdate = {
    name?: string | null
    income?: number | null
    avatar_url?: string | null
}

const profileKeys = {
    all: ['profiles'] as const,
    current: () => [...profileKeys.all, 'current'] as const,
}

export const useProfile = () => {
    const { user } = useAuth()

    return useQuery({
        queryKey: profileKeys.current(),
        enabled: Boolean(user?.id),
        queryFn: async (): Promise<Profile | null> => {
            if (!user?.id) return null

            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, income, avatar_url')
                .eq('id', user.id)
                .maybeSingle()

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
    })
}

export const useUpdateProfile = () => {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (updates: ProfileUpdate) => {
            if (!user?.id) {
                throw new Error('Usuário não autenticado')
            }

            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select('id, name, email, income, avatar_url')
                .single()

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(profileKeys.current(), data)
        },
    })
}

const MAX_IMAGE_SIZE = 256
const COMPRESSION_QUALITY = 0.85

const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'))
            return
        }

        img.onload = () => {
            let { width, height } = img

            // Calculate new dimensions maintaining aspect ratio
            if (width > height) {
                if (width > MAX_IMAGE_SIZE) {
                    height = Math.round((height * MAX_IMAGE_SIZE) / width)
                    width = MAX_IMAGE_SIZE
                }
            } else {
                if (height > MAX_IMAGE_SIZE) {
                    width = Math.round((width * MAX_IMAGE_SIZE) / height)
                    height = MAX_IMAGE_SIZE
                }
            }

            canvas.width = width
            canvas.height = height

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Falha ao comprimir imagem'))
                    }
                },
                'image/webp',
                COMPRESSION_QUALITY
            )
        }

        img.onerror = () => reject(new Error('Falha ao carregar imagem'))
        img.src = URL.createObjectURL(file)
    })
}

export const useUploadAvatar = () => {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (file: File): Promise<string> => {
            if (!user?.id) {
                throw new Error('Usuário não autenticado')
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('O arquivo deve ser uma imagem')
            }

            // Validate file size (5MB limit before compression)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('A imagem deve ter no máximo 5MB')
            }

            // Compress the image
            const compressedBlob = await compressImage(file)

            // Generate unique filename
            const timestamp = Date.now()
            const filename = `${user.id}/${timestamp}.webp`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filename, compressedBlob, {
                    contentType: 'image/webp',
                    upsert: true,
                })

            if (uploadError) {
                throw new Error(`Falha no upload: ${uploadError.message}`)
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filename)

            const avatarUrl = urlData.publicUrl

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id)

            if (updateError) {
                throw new Error(`Falha ao atualizar perfil: ${updateError.message}`)
            }

            return avatarUrl
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.current() })
        },
    })
}
