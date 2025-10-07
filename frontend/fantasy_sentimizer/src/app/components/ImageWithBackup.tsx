"use client";

// components/ImageWithFallback.tsx
import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    fill?: boolean;
    priority?: boolean;
}

export function ImageWithFallback({
    src,
    alt,
    width,
    height,
    className = '',
    fill = false,
    priority = false
}: ImageWithFallbackProps) {
    const [imgSrc, setImgSrc] = useState<string>(src);
    const [isError, setIsError] = useState<boolean>(false);

    const handleError = () => {
        if (!isError) {
            setIsError(true);
            setImgSrc("/images/default_profile.jpeg");
        }
    };

    return (
        <Image
            src={imgSrc}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            className={className}
            onError={handleError}
            priority={priority}
        />
    );
}

