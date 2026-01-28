import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Camera, Loader2, Save, User } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'

const profileSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
    income: z.coerce.number().min(0, 'Renda deve ser positiva').nullable(),
})

type ProfileFormData = {
    name: string
    income: number | null
}

const ProfilePage = () => {
    const { data: profile, isLoading: profileLoading } = useProfile()
    const updateProfile = useUpdateProfile()
    const uploadAvatar = useUploadAvatar()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema) as never,
        values: {
            name: profile?.name ?? '',
            income: profile?.income ?? null,
        },
    })

    const onSubmit = async (data: ProfileFormData) => {
        await updateProfile.mutateAsync({
            name: data.name,
            income: data.income ?? null,
        })
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Show preview immediately
        const previewUrl = URL.createObjectURL(file)
        setAvatarPreview(previewUrl)

        try {
            await uploadAvatar.mutateAsync(file)
        } catch (error) {
            // Reset preview on error
            setAvatarPreview(null)
            console.error('Upload failed:', error)
        } finally {
            // Clear the input so same file can be selected again
            event.target.value = ''
        }
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U'
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
    }

    const displayAvatarUrl = avatarPreview ?? profile?.avatar_url

    if (profileLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando perfil...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl py-8 mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <Button asChild variant="ghost" size="icon" className="rounded-full">
                    <Link to="/">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Voltar</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Meu Perfil</h1>
                    <p className="text-sm text-muted-foreground">
                        Gerencie suas informações pessoais
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Avatar Card */}
                <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Foto de Perfil</CardTitle>
                        <CardDescription>
                            Clique na foto para alterar. Máximo 5MB.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={uploadAvatar.isPending}
                                className={cn(
                                    'group relative rounded-full ring-2 ring-border ring-offset-2 ring-offset-background transition-all',
                                    'hover:ring-primary focus:outline-none focus:ring-primary',
                                    uploadAvatar.isPending && 'cursor-not-allowed opacity-70'
                                )}
                            >
                                <Avatar className="h-24 w-24 sm:h-28 sm:w-28">
                                    <AvatarImage src={displayAvatarUrl ?? undefined} alt={profile?.name ?? 'Avatar'} />
                                    <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                                        {getInitials(profile?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={cn(
                                        'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity',
                                        'group-hover:opacity-100 group-focus:opacity-100',
                                        uploadAvatar.isPending && 'opacity-100'
                                    )}
                                >
                                    {uploadAvatar.isPending ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-white" />
                                    )}
                                </div>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="text-center sm:text-left">
                                <p className="font-medium">{profile?.name ?? 'Sem nome'}</p>
                                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                                {uploadAvatar.isError && (
                                    <p className="mt-2 text-sm text-destructive">
                                        {uploadAvatar.error?.message ?? 'Erro ao fazer upload'}
                                    </p>
                                )}
                                {uploadAvatar.isSuccess && (
                                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                        Foto atualizada com sucesso!
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Form Card */}
                <Card className="border-border/60 bg-card/80 backdrop-blur">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                        <CardDescription>
                            Atualize seu nome e renda mensal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="Seu nome completo"
                                        className="pl-10"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="income">Renda Mensal (R$)</Label>
                                <Input
                                    id="income"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    {...register('income')}
                                />
                                {errors.income && (
                                    <p className="text-sm text-destructive">{errors.income.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Usada para calcular sua proporção de gastos
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    disabled={updateProfile.isPending}
                                >
                                    <Link to="/">Cancelar</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!isDirty || updateProfile.isPending}
                                    className="min-w-[100px]"
                                >
                                    {updateProfile.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Salvar
                                        </>
                                    )}
                                </Button>
                            </div>

                            {updateProfile.isError && (
                                <p className="text-sm text-destructive">
                                    {updateProfile.error?.message ?? 'Erro ao salvar perfil'}
                                </p>
                            )}
                            {updateProfile.isSuccess && (
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Perfil atualizado com sucesso!
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ProfilePage
