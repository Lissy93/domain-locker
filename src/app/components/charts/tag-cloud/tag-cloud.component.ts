import { Component, OnInit, ElementRef, ViewChild, HostListener, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { Router } from '@angular/router';
import DatabaseService from '~/app/services/database.service';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface CloudWord {
  text: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
  rotate?: number;
}

@Component({
  standalone: true,
  selector: 'app-tag-cloud',
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './tag-cloud.component.html',
  styles: [`
    ::ng-deep svg g text {
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        opacity: 0.8;
      }
    }
  `],
})
export class DomainTagCloudComponent implements OnInit, OnDestroy {
  @ViewChild('wordCloudContainer', { static: true }) wordCloudContainer!: ElementRef;
  private resizeTimeout: any;
  private subscription: Subscription = new Subscription();

  width = 400;
  height = 400;
  words: CloudWord[] = [];
  loading = true;

  constructor(
    private databaseService: DatabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTagsWithCounts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    clearTimeout(this.resizeTimeout);
  }

  @HostListener('window:resize')
  onResize(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.renderCloud(this.words), 300); // Debounce resize event
  }

  loadTagsWithCounts(): void {
    this.loading = true;
    const sub = this.databaseService.instance.tagQueries.getTagsWithDomainCounts().pipe(
      debounceTime(300) // Debounce incoming data
    ).subscribe({
      next: (tagsWithCounts) => {
        const words = tagsWithCounts.map(tag => ({
          text: tag.name,
          size: (tag.domain_count + 2) * 10,
          color: tag.color ? `var(--${tag.color}-400)` : 'var(--text-color)'
        }));
        this.words = words;
        this.renderCloud(words);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching tags with domain counts:', error);
        this.loading = false;
      }
    });
    this.subscription.add(sub); // Manage subscriptions to avoid memory leaks
  }

  renderCloud(words: CloudWord[]): void {
    const element = this.wordCloudContainer.nativeElement;

    if (!element) return; // Early exit if container is not found

    // Clear previous SVG on resize or re-render
    d3.select(element).select('svg').remove();

    const { width, height } = element.getBoundingClientRect();

    if (width === 0 || height === 0) return; // Avoid rendering if container size is invalid

    this.width = width;
    this.height = height;

    try {
      cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        .rotate(() => ~~(Math.random() * 2) * 90)
        .font('Impact')
        .fontSize((d: any) => d.size)
        .on('end', this.draw.bind(this))
        .start();
    } catch (err) {
      console.error('Error rendering word cloud:', err);
    }
  }

  draw(words: CloudWord[]): void {
    const element = this.wordCloudContainer.nativeElement;

    if (!element) return;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

    const wordSelection = svg.selectAll('text')
      .data(words);

    wordSelection.enter().append('text')
      .style('font-size', (d: CloudWord) => `${d.size}px`)
      .style('fill', (d: CloudWord) => d.color)
      .attr('text-anchor', 'middle')
      .attr('transform', (d: CloudWord) => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
      .text((d: CloudWord) => d.text)
      .on('click', (_event: Event, wordObj: CloudWord) => {
        if (wordObj && wordObj.text) {
          this.router.navigate([`/assets/tags/${wordObj.text}`]);
        }
      });

    wordSelection.exit().remove();
  }
}
