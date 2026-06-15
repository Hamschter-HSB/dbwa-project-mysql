import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TmdbService } from '../../services/tmdb.service';

@Component({
  selector: 'app-season-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './season-detail.component.html',
  styleUrls: ['./season-detail.component.css']
})
export class SeasonDetailComponent implements OnInit {
  seasonDetails: any = null;
  loading = true;
  showId!: number;
  seasonNumber!: number;

  constructor(
    private route: ActivatedRoute,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.showId = Number(params.get('id'));
      this.seasonNumber = Number(params.get('season_number'));
      this.loadSeasonDetails();
    });
  }

  loadSeasonDetails(): void {
    this.loading = true;
    this.tmdbService.getSeasonDetails(this.showId, this.seasonNumber).subscribe({
      next: (res) => {
        this.seasonDetails = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load season details', err);
        this.loading = false;
      }
    });
  }

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }

  getStillUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w300${path}` : '';
  }
}
