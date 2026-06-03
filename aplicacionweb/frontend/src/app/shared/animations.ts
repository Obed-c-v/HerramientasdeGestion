import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const fadeInSlide = trigger('fadeInSlide', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
]);

export const staggerAnimation = trigger('staggerAnimation', [
    transition('* => *', [
        query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            stagger(50, [
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ], { optional: true })
    ])
]);

export const scaleIn = trigger('scaleIn', [
    transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.97)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
    ])
]);
