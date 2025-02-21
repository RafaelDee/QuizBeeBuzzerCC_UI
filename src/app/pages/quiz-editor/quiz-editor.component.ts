import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  QuizManagerService,
  QuizQuestion,
} from '../../utilities/services/quiz-manager.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
/**TODO: CKEDITOR */
@Component({
  selector: 'app-quiz-editor',
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag, RouterLink],
  templateUrl: './quiz-editor.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizEditorComponent {
  currentQuestionIndex = null;

  //TODO: make a subscribable
  currentQuestion: QuizQuestion;
  isNew = false;
  questions;
  constructor(public quizServ: QuizManagerService) {
    this.questions = quizServ.questions;
    //TODO: select first to be shown
  }
  changeQuestion(index: number) {
    this.saveQuestion();
    this.isNew = false;
    this.currentQuestion = this.quizServ.questions[index];
    this.currentQuestionIndex = index;
  }
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    this.quizServ.saveQuestionIndex();
  }
  newQuestion() {
    //this.currentQuestionIndex = null;
    this.currentQuestion = QuizQuestion.createNew('', '');
    this.currentQuestionIndex = null;
    this.isNew = true;
  }
  discardQuestion() {
    if (!this.currentQuestion) return;
    this.currentQuestion = null;
    this.isNew = false;
    /* if (this.isNew) {
      this.quizServ.saveQuestion(this.currentQuestion);
    } */
  }
  deleteQuestion() {
    if (!this.currentQuestion) return;
    this.quizServ.removeQuestion(this.currentQuestion.id);
    this.currentQuestion = null;
    this.isNew = false;
    /* if (this.isNew) {
      this.quizServ.saveQuestion(this.currentQuestion);
    } */
  }
  saveQuestion() {
    if (!this.currentQuestion) return;
    this.quizServ.saveQuestion(this.currentQuestion);
    this.currentQuestion = null;
    this.isNew = false;
    /* if (this.isNew) {
      this.quizServ.saveQuestion(this.currentQuestion);
    } */
  }
}
